var video;

var scene, camera, renderer;
var rt1, rt2;
var rtSwitch = true;
var videoTexture, videoMaterial;
var vidWidth, vidHeight;

var stats;

function init() {
  statsInit();
  // webCamInit -> setUp -> start animate
  webCamInit();
}

function setup() {

  // Three.js basics
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(vidWidth/-2, vidWidth/2, vidHeight/2, vidHeight/-2, 1, 2000);
  camera.position.z = 500;  // カメラの near/far クリッピングと合わせて設定する

  // renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  renderer = new THREE.WebGLRenderer({});
  renderer.setSize(vidWidth, vidHeight);
  // renderer.autoClearColor = false

  gl = renderer.getContext();

  if ( !gl.getExtension( "OES_texture_float" )) {
    alert( "No OES_texture_float support for float textures!" );
    return;
  }

  // RTT
  rt1 = new THREE.WebGLRenderTarget( vidWidth, vidHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat, type: THREE.FloatType }  );
  rt2 = new THREE.WebGLRenderTarget( vidWidth, vidHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat, type: THREE.FloatType }  );

  checkVersion(renderer);
  document.body.appendChild(renderer.domElement);

  videoTexture = new THREE.Texture(video);  // なんとこれだけでテクスチャとして使える！
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;

  videoMaterial = new THREE.ShaderMaterial(THREE.BlendShader);
  videoMaterial.uniforms['tDiffuse1'].value = videoTexture;
  videoMaterial.uniforms['tDiffuse2'].value = null;
  videoMaterial.uniforms['mixRatio'].value = 0.0;

  var planeGeometry = new THREE.PlaneBufferGeometry( vidWidth, vidHeight, 1, 1 );
  var plane = new THREE.Mesh( planeGeometry, videoMaterial );  // 平面に書き込む
  plane.position.z = 0;

  scene.add(plane);

  console.log("scene setupped");

  animate();
}

function animate() {
  if(video.readyState === video.HAVE_ENOUGH_DATA) {

    if(videoTexture) videoTexture.needsUpdate = true;

    if(rtSwitch) renderer.render(scene, camera, rt2);
    else renderer.render(scene, camera, rt1);
    renderer.render(scene, camera);

    if(rtSwitch) videoMaterial.uniforms['tDiffuse2'].value = rt2;
    else videoMaterial.uniforms['tDiffuse2'].value = rt1;
    rtSwitch = !rtSwitch;

    // videoMaterial.needsUpdate = true;
    // (不要) ShadedMaterial の uniform 変数は、変更が自動的に反映される、らしい
  }

  stats.update();

  // loop
  requestAnimationFrame(animate);
  // setTimeout( function() {
  //   requestAnimationFrame(animate);
  // }, 1000/30);
}

function changeMixRatio( element ) {
  var ratio = Number(element.value);
  // var _ratio = element.value;
  console.log(ratio);
  if(ratio == 0.7) videoMaterial.uniforms['mixRatio'].value = 0;
  else videoMaterial.uniforms['mixRatio'].value = ratio;

}

function statsInit() {
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  document.body.appendChild( stats.domElement );
}

function webCamInit() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || window.navigator.mozGetUserMedia;
  window.URL = window.URL || window.webkitURL;

  video = document.getElementById('video');
  video.autoplay = true;  // これを外すと、スタート時の映像で停止します

  var option = {
    video: { mandatory:{ minWidth: 1280 } }, // firefoxだと失敗する
    audio: false
  }
  // var option = {video: true};

  // 1st try FullHD
  navigator.getUserMedia(option,
    function(stream) { // for success case
      video.src = window.URL.createObjectURL(stream);  // videoタグにストリームを流し込む
    },
    function(err) { // for error case
      console.log(err);
    }
  );

  video.addEventListener('loadeddata', function() {
    // Chromeは問題無いが、Firefoxだと、'loadeddata' イベントでvideoWidthらが埋まっていないので、値が得られるまで待機
    (function getVideoResolution() {
      vidWidth = video.videoWidth;
      vidHeight = video.videoHeight;
      if(vidWidth != 0) {
        console.log("video width: " + vidWidth + " height: " + vidHeight);
        setup();
      } else {
        setTimeout(getVideoResolution, 250);
      }
    })();
  });
}

function checkVersion(_renderer) {
  var _gl = _renderer.context;
  console.log( _gl.getParameter(_gl.VERSION) );
  console.log( _gl.getParameter(_gl.SHADING_LANGUAGE_VERSION) );
}

// start on load.
window.onload = init;
