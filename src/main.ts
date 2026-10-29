/* Boot. The modules run in the same order as the old <script> blocks:
   the story mode registers its keydown listener before the UI's, and relies on it. */
import './_monolith/01-sprites';
import './_monolith/02-engine';
import './_monolith/03-world-art.js';
import './_monolith/04-world-maps';
import './_monolith/05-world.js';
import './_monolith/06-ui.js';
