
/* ======================  COMMENTARY ======================

Findings:
During experimentation with thresholding on the individual red, green, and 
blue channels, I noticed clear differences in how each channel behaved. The 
red channel often produced the strongest contrast but also introduced extra 
noise, especially in complex backgrounds. The green channel gave more 
balanced and reliable results, while the blue channel tended to be darker.
When I moved to alternative colour spaces such as CMY and HSV, I observed more meaningful separations in certain cases. 
Thresholding in HSV was particularly effective because the “value” component 
represents brightness separately from colour, which made detecting objects 
more consistent compared to using RGB alone. CMY provided contrast by inverting the original channels, which highlighted areas in a 
different way. Overall, I found that moving away from plain RGB allowed for cleaner and sometimes more robust results, 
especially in scenes with different lighting.

Problems faced:
One of the early issues I faced was getting the calculation for HSV and CMY 
conversions right. Although I managed to work through them, they initially 
caused confusion. A bigger challenge, however, was implementing face 
detection. It took time to correctly identify and track face in the frame. 
Motion detection was also demanding, as it required comparing frames 
efficiently and setting an appropriate threshold to avoid false positives. 
Lastly, my initial code structure was not modular enough, so I reorganized it into classes such as
FaceDetectionSystem, and MotionDetectionSystem,etc which made the program 
cleaner and more manageable.

Progress and improvements:
For the most part, I was on target to complete the project successfully, but 
I underestimated how time-consuming it would be to integrate both motion 
detection with heatmap overlay and face detection. If I were to redo the project, I would start 
with a clearer plan for class design and try to avoid using global variables. 
A stronger focus on modularity from the beginning would have made later 
stages smoother and would have left more time for experimenting with 
extensions. I also think spending more time at the start on the mathematics 
for HSV and CMY would have reduced debugging later on.

Extension(Motion detection with heatmap overlay):
As an extension, I implemented motion detection with a heatmap-style 
visualization to highlight regions with the most activity. The system works 
by comparing each new frame with the previous one and recording areas where 
significant pixel differences occur. These regions are then visualized in a 
way that emphasizes the strength of the motion which looks like a heatmap. This creates an interactive, 
real-time effect that goes beyond the basic requirements of the assignment. 
I consider this extension unique because it demonstrates analysis of dynamic 
movement rather than just static filtering, and it could form the basis for 
more advanced applications such as gesture recognition, behavioural analysis, 
or even lightweight security monitoring systems.

================================================================= */

var capture;            
var video;              
var detector;           
var tmpDetImg;         
var liveFaceBox = null;   
var frozenFaceBox = null; 
var snapImage = null;     
var isFrozen = false;    

// camera source size 
var w = 320;
var h = 240;

// sliders 
var redSlider, greenSlider, blueSlider, cmySlider, hsvSlider;

//button
var snapBtn;

var faceMode = 0; 

let prevFrame;        
let motionLevel = 0;  

//extension box
let motionBoxX = 700;
let motionBoxY = 320;
let motionBoxW = 240;
let motionBoxH = 180;

let motionPixels = []; 

let app;

function setup() {
  app = new ImageProcessingApp();
  app.setup();
}

function draw() {
  app.draw();
}

function keyPressed() {
  app.keyPressed();
}

class ImageProcessingApp {
  constructor() {
    this.ui = new InterfaceControls();
    this.videoSys = new VideoSystem();
    this.detectorSys = new FaceDetectionSystem(160, 120, 2, objectdetect.frontalface);
    this.motion = new MotionDetectionSystem();
  }

  setup() {
    createCanvas(1080, 800);
    pixelDensity(1);

    // webcam 
    this.videoSys.init(w, h);
    capture = this.videoSys.capture;
    video   = this.videoSys.video;

    this.detectorSys.init();
    detector  = this.detectorSys.detector;
    tmpDetImg = this.detectorSys.tmpDetImg;
    this.ui.init();
    snapBtn = this.ui.snapBtn;
    snapBtn.mousePressed(this.onSnapToggle.bind(this));

    redSlider   = this.ui.redSlider;
    greenSlider = this.ui.greenSlider;
    blueSlider  = this.ui.blueSlider;
    cmySlider   = this.ui.cmySlider;
    hsvSlider   = this.ui.hsvSlider;
  }

  onSnapToggle() {
    if (isFrozen === false) {
      var frame = capture.get();
      frame.resize(160, 120);
      snapImage = createImage(160, 120);
      snapImage.copy(frame, 0, 0, 160, 120, 0, 0, 160, 120);

      if (liveFaceBox) {
        frozenFaceBox = { x: liveFaceBox.x, y: liveFaceBox.y, w: liveFaceBox.w, h: liveFaceBox.h };
      } else {
        frozenFaceBox = null;
      }
      isFrozen = true;
    } else {
      isFrozen = false;
      frozenFaceBox = null;
    }
  }

  draw() {
    background("lightBlue");

    // white grid boxes
    noStroke();
    for (var x = 0; x < 4; x++){
       fill("white"); 
       rect(50,  150 + x * 160, 160, 120); 
    }
    for (var y = 0; y < 4; y++) {
       fill("white"); 
       rect(240, 150 + y * 160, 160, 120); 
    }
    for (var z = 0; z < 4; z++) { 
      fill("white"); 
      rect(430, 150 + z * 160, 160, 120); 
    }

    // Motion Detection Extension Box
    fill("white");
    rect(motionBoxX, motionBoxY, motionBoxW, motionBoxH);

    // Title
    fill(0);
    noStroke();
    textSize(17);
    text("Motion Detection & Heatmap Extension", motionBoxX-20 , motionBoxY - 30);

    // showing camera inside motion box
    image(video, motionBoxX, motionBoxY, motionBoxW, motionBoxH);

    // runing motion detection
    this.motion.detect();

    // Drawing heatmap overlay on the video
    for (let mp of motionPixels) {
      let intensity = constrain(mp.strength, 0, 255);
      let col = color(255, intensity, 0, 150);  
      noStroke();
      fill(col);

      // scaling pixel position to motion box sizee
      let sx = map(mp.x, 0, video.width, motionBoxX, motionBoxX + motionBoxW);
      let sy = map(mp.y, 0, video.height, motionBoxY, motionBoxY + motionBoxH);

      ellipse(sx, sy, 6, 6); // coloured circle for heatmap effect
    }

    //displaying instructions
    fill(0);
    textSize(17);
    text("INSTRUCTIONS" ,   motionBoxX-20, motionBoxY - 220);
    textSize(14)
    text("-Press the 'take a snap' button to click a snapshot." ,  motionBoxX-100, motionBoxY - 180);
    text("-For face detection, once face is detected click the button." ,  motionBoxX-100 , motionBoxY - 160);
    text("-Then Use keys 1,2,3,4 to switch between different modes" ,  motionBoxX-100 , motionBoxY - 140 );
    text("-Use key '0' to reset" ,  motionBoxX-100 , motionBoxY - 120 )
    text("-Use sliders below each grid to control thresholds." ,  motionBoxX-100 , motionBoxY -100);

    text("-When you move in front of the camera, areas with movement will glow." ,  motionBoxX-100 , motionBoxY + 240);
    text("-This extension detects motion , and highlights it using a heatmap-style effect" , motionBoxX-100 , motionBoxY + 260);
    text("-If you stay still, nothing will be highlighted" , motionBoxX , motionBoxY + 280);
    text("-This extension runs live at all times." , motionBoxX , motionBoxY + 300);

    // Showing alert if significant motion is detected
    if (motionLevel > 0.05) {
      fill(0);
      noStroke();
      textSize(18);
      text("MOTION DETECTED!", motionBoxX + 20, motionBoxY + motionBoxH + 20);
    }

    // image source for tiles
    var src;
    if (isFrozen && snapImage) {
      src = snapImage;
    } else {
      src = video;
    }
    
    // originals
    image(src, 50, 20, 160, 120);      // top-left preview
    image(src, 50, 470, 160, 120);     // mid-left

    // filters (unchanged)
    image(grayScaleFilter(src), 240, 20, 160, 120);
    image(redChannel(src),      50,  150, 160, 120); 
    image(greenChannel(src),    240, 150, 160, 120);
    image(blueChannel(src),     430, 150, 160, 120);
    image(thresholdRed(src),    50,  310, 160, 120);
    image(thresholdGreen(src),  240, 310, 160, 120);
    image(thresholdBlue(src),   430, 310, 160, 120);
    image(cmyColorSpace(src),   240, 470, 160, 120); 
    image(hsvColorSpace(src),   430, 470, 160, 120);
    image(cmyThreshold(src),    240, 630, 160, 120);
    image(hsvThreshold(src),    430, 630, 160, 120);

    // live face  detection
    if (!isFrozen) {
      this.detectorSys.updateLiveFaceBox();

      image(video, 50, 630, 160, 120);

      if (liveFaceBox) {
        noFill();
        stroke(0, 255, 0); 
        strokeWeight(2);
        rect(50 + liveFaceBox.x, 630 + liveFaceBox.y, liveFaceBox.w, liveFaceBox.h);

        fill(0);
        noStroke();
        textSize(12);
        text("Face Detected", 50 + liveFaceBox.x, 630 + liveFaceBox.y - 15);
      }
    }

    // Handling frozen snapshot case 
    if (isFrozen && snapImage) {
      image(snapImage, 50, 630, 160, 120);

      if (frozenFaceBox) {
        if (faceMode === 0) {
          noFill();
          stroke(255, 0, 0);
          strokeWeight(2);
          rect(50 + frozenFaceBox.x, 630 + frozenFaceBox.y, frozenFaceBox.w, frozenFaceBox.h);
        
          fill(255, 0, 0);
          noStroke();
          textSize(12);
          text(
            "Face Detected",50 + frozenFaceBox.x,630 + frozenFaceBox.y - 15
          );
        }
        else {
          drawFaceTransformed(snapImage, frozenFaceBox, 50, 630);
        }
      }
    }
  }

  keyPressed() {
    if (key === '1'){ faceMode = 1;}
    if (key === '2'){ faceMode = 2;}
    if (key === '3'){ faceMode = 3;}
    if (key === '4'){ faceMode = 4;}
    if (key === '0'){ faceMode = 0;} 
  }
}

class VideoSystem {
  constructor() {
    this.capture = null; //raw vid
    this.video = null;  //processed vid ref
  }
  init(width, height) {
    this.capture = createCapture(VIDEO);
    this.capture.size(width, height);
    this.capture.hide();
    this.video = this.capture;
  }
}

//face detetcion setup
class FaceDetectionSystem {
  constructor(detW, detH, detScale, classifierRef) {
    this.detW = detW;
    this.detH = detH;
    this.detScale = detScale;
    this.classifierRef = classifierRef;

    this.detector = null;
    this.tmpDetImg = null;
  }

  init() {
    // Creating face detector with given parameters
    this.detector = new objectdetect.detector(this.detW, this.detH, this.detScale, this.classifierRef);
    // Temporary image to hold scaled frames for detection
    this.tmpDetImg = createImage(this.detW, this.detH);
  }

  // Copying current video frame into temporary detection image
  updateLiveFaceBox() {
    this.tmpDetImg.copy(
      capture,
      0, 0, capture.width, capture.height,
      0, 0, this.tmpDetImg.width, this.tmpDetImg.height
    );

    // Run detection on the copied frame
    var faces = this.detector.detect(this.tmpDetImg.canvas);

    var best = null;
    var bestArea = -1;

    // Loop through all detected faces
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];         
      var score = f[4];

      // Only accept detections above this threshold
      if (score > 3) {
        var area = f[2] * f[3];
        if (area > bestArea) {
          bestArea = area;
          best = { x: f[0], y: f[1], w: f[2], h: f[3] };
        }
      }
    }

    if (best) { liveFaceBox = best; }
    else { liveFaceBox = null; }
  }
}

class MotionDetectionSystem {
  detect() {
    video.loadPixels();
    if (!video.pixels.length) return;

    if (!prevFrame) {
      prevFrame = video.get(); // save first frame
      return;
    }

    prevFrame.loadPixels();
    motionPixels = [];  // reset for each frame
    let diffCount = 0;

    // Looping through every pixel
    for (let i = 0; i < video.pixels.length; i += 4) {
      let r1 = video.pixels[i],   g1 = video.pixels[i+1],   b1 = video.pixels[i+2];
      let r2 = prevFrame.pixels[i], g2 = prevFrame.pixels[i+1], b2 = prevFrame.pixels[i+2];

      let diff = abs(r1 - r2) + abs(g1 - g2) + abs(b1 - b2);

      if (diff > 50) {  // threshold for motion
        diffCount++;

        // convert pixel index
        let px = (i / 4) % video.width;
        let py = floor((i / 4) / video.width);

        // Save pixel coordinate and motion strength
        motionPixels.push({x: px, y: py, strength: diff});
      }
    }

    motionLevel = diffCount / (video.width * video.height);
    prevFrame = video.get(); // update for next frame
  }
}

// Buttons and sliders used for interaction
class InterfaceControls {
  constructor() {
    this.snapBtn = null;
    this.redSlider = null;
    this.greenSlider = null;
    this.blueSlider = null;
    this.cmySlider = null;
    this.hsvSlider = null;
  }

  init() {
    // button creation and styling 
    this.snapBtn = createButton("Take a snap!");
    this.snapBtn.position(450, 80);
    this.snapBtn.style("background-color", "black"); 
    this.snapBtn.style("color", "white");              
    this.snapBtn.style("font-size", "16px");
    this.snapBtn.style("padding", "10px 20px");
    this.snapBtn.style("border", "none");
    this.snapBtn.style("border-radius", "20px");       
    this.snapBtn.style("cursor", "pointer");        

    // sliders 
    this.redSlider   = createSlider(0, 255, 128, 1); 
    this.redSlider.position(70, 440);

    this.greenSlider = createSlider(0, 255, 128, 1); 
    this.greenSlider.position(260, 440);

    this.blueSlider  = createSlider(0, 255, 128, 1); 
    this.blueSlider.position(460, 440);

    this.cmySlider   = createSlider(0, 255, 128, 1); 
    this.cmySlider.position(270, 760);

    this.hsvSlider   = createSlider(0, 255, 128, 1); 
    this.hsvSlider.position(460, 760);
  }
}

function grayScaleFilter(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * img.width) * 4;
      var r = img.pixels[i];
      var g = img.pixels[i + 1];
      var b = img.pixels[i + 2];

      // Computing average 
      var gray = (r + g + b) / 3;

      // Increasing brightness by 20%
      gray = gray * 1.2;

      //conditional so it doesnt go beyond 255
      if (gray > 255){
        gray = 255;
      }
      out.pixels[i]     = gray;
      out.pixels[i + 1] = gray;
      out.pixels[i + 2] = gray;
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function redChannel(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * img.width) * 4;
      var r = img.pixels[i];

      // Keeping red value only
      out.pixels[i]     = r;
      out.pixels[i + 1] = 0;
      out.pixels[i + 2] = 0;
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function greenChannel(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * img.width) * 4;
      var g = img.pixels[i + 1];

      // Keeping green value only
      out.pixels[i]     = 0;
      out.pixels[i + 1] = g;
      out.pixels[i + 2] = 0;
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function blueChannel(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * img.width) * 4;
      var b = img.pixels[i + 2];

      // Keeping blue value only
      out.pixels[i]     = 0;
      out.pixels[i + 1] = 0;
      out.pixels[i + 2] = b;
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function thresholdRed(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();
  var t = redSlider.value();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * out.width) * 4;
      var r = img.pixels[i];

      //  red channel will be displayed only if r > threshold
      if (r > t) {
        out.pixels[i]     = 255;
        out.pixels[i + 1] = 0;
        out.pixels[i + 2] = 0;
      } else {
        out.pixels[i]     = 0;
        out.pixels[i + 1] = 0;
        out.pixels[i + 2] = 0;
      }
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function thresholdGreen(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();
  var t = greenSlider.value();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * out.width) * 4;
      var g = img.pixels[i + 1];

      // green channel will be displayed only if g > threshold
      if (g > t) {
        out.pixels[i]     = 0;
        out.pixels[i + 1] = 255;
        out.pixels[i + 2] = 0;
      } else {
        out.pixels[i]     = 0;
        out.pixels[i + 1] = 0;
        out.pixels[i + 2] = 0;
      }
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function thresholdBlue(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();
  var t = blueSlider.value();

  for (var x = 0; x < out.width; x++) {
    for (var y = 0; y < out.height; y++) {
      var i = (x + y * out.width) * 4;
      var b = img.pixels[i + 2];

      //  blue channel will be displayed only if b > threshold
      if (b > t) {
        out.pixels[i]     = 0;
        out.pixels[i + 1] = 0;
        out.pixels[i + 2] = 255;
      } else {
        out.pixels[i]     = 0;
        out.pixels[i + 1] = 0;
        out.pixels[i + 2] = 0;
      }
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function cmyColorSpace(img) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  for (let x = 0; x < img.width; x++) {
      for (let y = 0; y < img.height; y++) {
          let index = (x + y * img.width) * 4;
          let r = img.pixels[index];
          let g = img.pixels[index + 1];
          let b = img.pixels[index + 2];

          //cmy conversion
          let C = 255 - r;
          let M = 255 - g;
          let Y = 255 - b;

          imgOut.pixels[index]     = C; 
          imgOut.pixels[index + 1] = M; 
          imgOut.pixels[index + 2] = Y; 
          imgOut.pixels[index + 3] = 255; 
      }
  }

  imgOut.updatePixels();
  return imgOut;
}

function hsvColorSpace(img) {
  var out = createImage(img.width, img.height);
  img.loadPixels(); out.loadPixels();

  for (var x = 0; x < img.width; x++) {
    for (var y = 0; y < img.height; y++) {
      var i = (x + y * img.width) * 4;
      var r = img.pixels[i];
      var g = img.pixels[i + 1];
      var b = img.pixels[i + 2];

      var maxv = Math.max(r, g, b);
      var minv = Math.min(r, g, b);
      var delta = maxv - minv;

      var v = maxv;
      var h = 0;
      var s = 0;

      //applying formulas for hsv
      if (maxv != 0){
        s = delta / maxv;
      }

      if (delta != 0) {
        var R = (maxv - r) / delta;
        var G = (maxv - g) / delta;
        var B = (maxv - b) / delta;

        if (r == maxv && g == minv) { h = 5 + B; }
        else if (r == maxv && g != minv) { h = 1 - G; }
        else if (g == maxv && b == minv) { h = R + 1; }
        else if (g == maxv && b != minv) { h = 3 - B; }
        else if (r == maxv) { h = 3 + G; }
        else { h = 5 - R; }
      }

      h = h * 60;
      if (h < 0) { h = h + 360; }

      out.pixels[i]     = Math.round(h / 360 * 255); //hue
      out.pixels[i + 1] = Math.round(s * 255);   //saturation 
      out.pixels[i + 2] = Math.round(v);  //value 
      out.pixels[i + 3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function cmyThreshold(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();
  var t = cmySlider.value();

  for (var x = 0; x < img.width; x++) {
    for (var y = 0; y < img.height; y++) {
      var i = (x + y * img.width) * 4;
      var r = img.pixels[i];
      var g = img.pixels[i + 1];
      var b = img.pixels[i + 2];

      var C = 255 - r;
      var M = 255 - g;
      var Y = 255 - b;

      // Using average intensity across Cmy channels
      var intensity = (C + M + Y) / 3;

      // Applying threshold
      var val;
      if (intensity > t) {
        val = 255;
      } else {
        val = 0;
      }
      
      out.pixels[i]     = val;
      out.pixels[i + 1] = val;
      out.pixels[i + 2] = val;
      out.pixels[i + 3] = 255;
    }
  }

  out.updatePixels();
  return out;
}

function hsvThreshold(img) {
  var out = createImage(img.width, img.height);
  out.loadPixels(); img.loadPixels();
  var t = hsvSlider.value();

  for (var x = 0; x < img.width; x++) {
    for (var y = 0; y < img.height; y++) {
      var i = (x + y * img.width) * 4;
      var r = img.pixels[i];
      var g = img.pixels[i + 1];
      var b = img.pixels[i + 2];

      var v = Math.max(r, g, b); // using brightness

      var val;
      if (v > t) {
        val = 255;
      } else {
        val = 0;
      }
      
      out.pixels[i]     = val;
      out.pixels[i + 1] = val;
      out.pixels[i + 2] = val;
      out.pixels[i + 3] = 255;
    }
  }

  out.updatePixels();
  return out;
}

function drawFaceTransformed(src, box, dx, dy) {
  // taking just the face region
  let faceImg = createImage(box.w, box.h);
  faceImg.copy(src, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);

  // applying filter
  let out;
  if (faceMode === 1) out = grayScaleFilter(faceImg);
  else if (faceMode === 2) out = blurFilter(faceImg);
  else if (faceMode === 3) out = hsvColorSpace(faceImg);
  else if (faceMode === 4) out = pixelateFilter(faceImg, 5);
  else out = faceImg;

  // paste filtered face back into the snapshot
  image(out, dx + box.x, dy + box.y, box.w, box.h);
}

function blurFilter(img) {
  let out = createImage(img.width, img.height);
  img.loadPixels();
  out.loadPixels();

  let radius = 4; 
  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      // Average pixels
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          let nx = x + dx;
          let ny = y + dy;
          if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
            let i = (nx + ny * img.width) * 4;
            rSum += img.pixels[i];
            gSum += img.pixels[i+1];
            bSum += img.pixels[i+2];
            count++;
          }
        }
      }
      // Assigning average color back to pixel
      let idx = (x + y * img.width) * 4;
      out.pixels[idx] = rSum / count;
      out.pixels[idx+1] = gSum / count;
      out.pixels[idx+2] = bSum / count;
      out.pixels[idx+3] = 255;
    }
  }
  out.updatePixels();
  return out;
}

function pixelateFilter(img, blockSize) {
  let out = createImage(img.width, img.height);
  img.loadPixels();
  out.loadPixels();

  for (let x = 0; x < img.width; x += blockSize) {
    for (let y = 0; y < img.height; y += blockSize) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      // Calculating average color of the block
      for (let dx = 0; dx < blockSize; dx++) {
        for (let dy = 0; dy < blockSize; dy++) {
          let nx = x + dx;
          let ny = y + dy;
          if (nx < img.width && ny < img.height) {
            let idx = (nx + ny * img.width) * 4;
            rSum += img.pixels[idx];
            gSum += img.pixels[idx+1];
            bSum += img.pixels[idx+2];
            count++;
          }
        }
      }

      let rAvg = rSum / count;
      let gAvg = gSum / count;
      let bAvg = bSum / count;

      // Filling block with average color
      for (let dx = 0; dx < blockSize; dx++) {
        for (let dy = 0; dy < blockSize; dy++) {
          let nx = x + dx;
          let ny = y + dy;
          if (nx < img.width && ny < img.height) {
            let idx = (nx + ny * img.width) * 4;
            out.pixels[idx] = rAvg;
            out.pixels[idx+1] = gAvg;
            out.pixels[idx+2] = bAvg;
            out.pixels[idx+3] = 255;
          }
        }
      }
    }
  }
  out.updatePixels();
  return out;
}

