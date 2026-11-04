// The trailer's encoder, with the frameworks macOS already has (no ffmpeg needed):
//   encode <frames dir> <music.wav> <out.mp4> [fps] [Mbit/s]   JPEG frames + WAV → H.264 + AAC, an .mp4 for anywhere
//   encode --stills <movie.mp4> <out dir> <seconds,…>   frames of a finished movie, to check it
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

func fail(_ s: String) -> Never { FileHandle.standardError.write((s + "\n").data(using: .utf8)!); exit(1) }
let args = CommandLine.arguments

if args.count > 1 && args[1] == "--stills" {
  guard args.count >= 5 else { fail("encode --stills <movie> <dir> <t,t,…>") }
  let gen = AVAssetImageGenerator(asset: AVURLAsset(url: URL(fileURLWithPath: args[2])))
  gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
  try? FileManager.default.createDirectory(atPath: args[3], withIntermediateDirectories: true)
  for t in args[4].split(separator: ",") {
    let time = CMTime(seconds: Double(t)!, preferredTimescale: 600)
    guard let img = try? gen.copyCGImage(at: time, actualTime: nil) else { print("no frame at \(t)"); continue }
    let url = URL(fileURLWithPath: args[3]).appendingPathComponent("t\(t).jpg")
    let dst = CGImageDestinationCreateWithURL(url as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dst, img, [kCGImageDestinationLossyCompressionQuality: 0.85] as CFDictionary)
    CGImageDestinationFinalize(dst)
    print(url.path)
  }
  exit(0)
}

guard args.count >= 4 else { fail("encode <frames dir> <music.wav> <out.mp4> [fps] [Mbit/s]") }
let dir = URL(fileURLWithPath: args[1]), audioURL = URL(fileURLWithPath: args[2]), outURL = URL(fileURLWithPath: args[3])
let fps = Int32(args.count > 4 ? Int(args[4])! : 30)
let mbps = args.count > 5 ? Double(args[5])! : 14
let files = ((try? FileManager.default.contentsOfDirectory(atPath: dir.path)) ?? []).filter { $0.hasSuffix(".jpg") }.sorted()
guard let firstName = files.first, let src0 = CGImageSourceCreateWithURL(dir.appendingPathComponent(firstName) as CFURL, nil),
      let img0 = CGImageSourceCreateImageAtIndex(src0, 0, nil) else { fail("no frames in \(dir.path)") }
let W = img0.width, H = img0.height

try? FileManager.default.removeItem(at: outURL)
let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let video = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: Int(mbps * 1_000_000), AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 60, AVVideoExpectedSourceFrameRateKey: fps, AVVideoAllowFrameReorderingKey: true
  ],
  AVVideoColorPropertiesKey: [
    AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2, AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
    AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2
  ]
])
video.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: video, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H
])
writer.add(video)

let asset = AVURLAsset(url: audioURL)
guard let track = asset.tracks(withMediaType: .audio).first else { fail("no audio in \(audioURL.path)") }
let reader = try AVAssetReader(asset: asset)
let pcm = AVAssetReaderTrackOutput(track: track, outputSettings: [
  AVFormatIDKey: kAudioFormatLinearPCM, AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false,
  AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false
])
reader.add(pcm)
let audio = AVAssetWriterInput(mediaType: .audio, outputSettings: [
  AVFormatIDKey: kAudioFormatMPEG4AAC, AVNumberOfChannelsKey: 2, AVSampleRateKey: 48000, AVEncoderBitRateKey: mbps >= 8 ? 256_000 : 160_000
])
audio.expectsMediaDataInRealTime = false
writer.add(audio)

guard writer.startWriting() else { fail("writer: \(String(describing: writer.error))") }
reader.startReading()
writer.startSession(atSourceTime: .zero)
let rgb = CGColorSpace(name: CGColorSpace.sRGB)!
let group = DispatchGroup()
var next = 0, videoDone = false, audioDone = false

group.enter()
video.requestMediaDataWhenReady(on: DispatchQueue(label: "video")) {
  while video.isReadyForMoreMediaData && !videoDone {
    if next >= files.count { videoDone = true; video.markAsFinished(); group.leave(); return }
    autoreleasepool {
      let url = dir.appendingPathComponent(files[next]) as CFURL
      guard let s = CGImageSourceCreateWithURL(url, nil), let img = CGImageSourceCreateImageAtIndex(s, 0, nil), let pool = adaptor.pixelBufferPool else { fail("bad frame \(files[next])") }
      var pb: CVPixelBuffer?
      CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb)
      guard let buf = pb else { fail("no pixel buffer") }
      CVPixelBufferLockBaseAddress(buf, [])
      let ctx = CGContext(data: CVPixelBufferGetBaseAddress(buf), width: W, height: H, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buf),
                          space: rgb, bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
      ctx.draw(img, in: CGRect(x: 0, y: 0, width: W, height: H))
      CVPixelBufferUnlockBaseAddress(buf, [])
      if !adaptor.append(buf, withPresentationTime: CMTime(value: Int64(next), timescale: fps)) { fail("append failed at \(next): \(String(describing: writer.error))") }
    }
    next += 1
    if next % 300 == 0 { print("  \(next) / \(files.count) frames") }
  }
}
group.enter()
audio.requestMediaDataWhenReady(on: DispatchQueue(label: "audio")) {
  while audio.isReadyForMoreMediaData && !audioDone {
    if let sb = pcm.copyNextSampleBuffer() { audio.append(sb) }
    else { audioDone = true; audio.markAsFinished(); group.leave(); return }
  }
}
group.wait()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status != .completed { fail("not completed: \(String(describing: writer.error))") }
print("\(outURL.path): \(files.count) frames, \(W)x\(H) @ \(fps) fps")
