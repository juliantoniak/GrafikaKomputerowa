var gl;
function startGL() 
{
  //alert("StartGL");
  let canvas = document.getElementById("canvas3D"); //wyszukanie obiektu w strukturze strony 
  gl = canvas.getContext("experimental-webgl"); //pobranie kontekstu OpenGL'u z obiektu canvas
  gl.viewportWidth = canvas.width; //przypisanie wybranej przez nas rozdzielczości do systemu OpenGL
  gl.viewportHeight = canvas.height;
  
    //Kod shaderów
  const vertextShaderSource = ` //Znak akcentu z przycisku tyldy - na lewo od przycisku 1 na klawiaturze
    attribute vec3 aVertexPosition;
    uniform mat4 uPMatrix;
    uniform mat4 uMVMatrix_Z;
    uniform mat4 uMVMatrix_X;
    uniform mat4 uMVMatrix_Y;
    void main(void) {
      //uMatrix = uMVMatrix_Z * uMVMatrix_X * uMVMatrix_Y;
      //mat4 uMatrix = uMVMatrix_X * uMVMatrix_Z * uMVMatrix_Y;
      mat4 uMatrix = uMVMatrix_X * uMVMatrix_Z;
      gl_Position = uPMatrix * uMatrix * vec4(aVertexPosition, 1.0); //Dokonanie transformacji położenia punktów z przestrzeni 3D do przestrzeni obrazu (2D)
    }
  `;
  const fragmentShaderSource = `
    void main(void) {
       gl_FragColor = vec4(0.0,1.0,0.0,1.0); //Ustalenie stałego koloru wszystkich punktów sceny
    }
  `;
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER); //Stworzenie obiektu shadera 
  let vertexShader   = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource); //Podpięcie źródła kodu shader
  gl.shaderSource(vertexShader, vertextShaderSource);
  gl.compileShader(fragmentShader); //Kompilacja kodu shader
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) { //Sprawdzenie ewentualnych błedów kompilacji
    alert(gl.getShaderInfoLog(fragmentShader));
    return null;
  }
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShader));
    return null;
  }
  
  let shaderProgram = gl.createProgram(); //Stworzenie obiektu programu 
  gl.attachShader(shaderProgram, vertexShader); //Podpięcie obu shaderów do naszego programu wykonywanego na karcie graficznej
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) alert("Could not initialise shaders");  //Sprawdzenie ewentualnych błedów
  
  //Opis sceny 3D, położenie punktów w przestrzeni 3D w formacie X,Y,Z 
  let vertexPosition = [
  //Top
    -1.0, +1.0, -1.0,  -1.0, +1.0, +1.0,  +1.0, +1.0, +1.0//, //3 punkty po 3 składowe - X1,Y1,Z1, X2,Y2,Z2, X3,Y3,Z3 - 1 trójkąt
    -1.0, +1.0, -1.0,  +1.0, +1.0, +1.0,  +1.0, +1.0, -1.0,
  //Left
    -1.0, -1.0, +1.0,  -1.0, +1.0, +1.0,  -1.0, -1.0, -1.0,
    -1.0, -1.0, -1.0,  -1.0, +1.0, +1.0,  -1.0, +1.0, -1.0,
  //Right
    +1.0, +1.0, +1.0,  +1.0, -1.0, +1.0,  +1.0, -1.0, -1.0,
    +1.0, +1.0, +1.0,  +1.0, -1.0, -1.0,  +1.0, +1.0, -1.0,
  //Front
    +1.0, -1.0, +1.0,  +1.0, +1.0, +1.0,  -1.0, -1.0, +1.0,
    -1.0, +1.0, +1.0,  -1.0, -1.0, +1.0,  +1.0, +1.0, +1.0,
  //Back
    +1.0, +1.0, -1.0,  +1.0, -1.0, -1.0,  -1.0, -1.0, -1.0,
    +1.0, +1.0, -1.0,  -1.0, -1.0, -1.0,  -1.0, +1.0, -1.0,
  //Bottom
    -1.0, -1.0, +1.0,  -1.0, -1.0, -1.0,  +1.0, -1.0, +1.0,
    +1.0, -1.0, +1.0,  -1.0, -1.0, -1.0,  +1.0, -1.0, -1.0
  ]
  
  let vertexPositionBuffer = gl.createBuffer(); //Stworzenie tablicy w pamieci karty graficznej
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPosition), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3; //zdefiniowanie liczby współrzednych per wierzchołek
  vertexPositionBuffer.numItems = 12; //Zdefinoiowanie liczby punktów w naszym buforze
  
  //Macierze opisujące położenie wirtualnej kamery w przestrzenie 3D
  let aspect = gl.viewportWidth/gl.viewportHeight;
  let fov = 45.0 * Math.PI / 180.0; //Określenie pola widzenia kamery
  let zFar = 100.0; //Ustalenie zakresów renderowania sceny 3D (od obiektu najbliższego zNear do najdalszego zFar)
  let zNear = 0.1;
  let uPMatrix = [
   1.0/(aspect*Math.tan(fov/2)),0                           ,0                         ,0                            ,
   0                         ,1.0/(Math.tan(fov/2))         ,0                         ,0                            ,
   0                         ,0                           ,-(zFar+zNear)/(zFar-zNear)  , -1,
   0                         ,0                           ,-(2*zFar*zNear)/(zFar-zNear) ,0.0,
  ];
  let angle = 20.0; //Macierz transformacji świata - określenie położenia kamery 
  
  //obrot na Z
  let uMVMatrix_Z = [
  Math.cos(angle*Math.PI/180.0),-Math.sin(angle*Math.PI/180.0),0,0, //Macierz Rotacji
  Math.sin(angle*Math.PI/180.0),Math.cos(angle*Math.PI/180.0),0,0,
  0,0,1,0.0,
  0,0,-5,1 //Położenie kamery; zmienic na 0,0,-5,1
  ];

  //obrot na X
  let uMVMatrix_X = [
    1,0,0,0,
    0, Math.cos(angle*Math.PI/180.0), -Math.sin(angle*Math.PI/180.0), 0,
    0, Math.sin(angle*Math.PI/180.0), Math.cos(angle*Math.PI/180.0), 0, 
    0,0,-5,1 //Położenie kamery; zmienic na 0,0,-5,1
  ]

  //obrot na Y
  let uMVMatrix_Y = [
    Math.cos(angle*Math.PI/180.0), -Math.sin(angle*Math.PI/180.0), 0, 0,
    Math.sin(angle*Math.PI/180.0), Math.cos(angle*Math.PI/180.0), 0, 0,
    0,0,1,0,
    0,0,-5,1
  ]

  
  //alert(uPMatrix)
  
  //Render Scene
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); 
  gl.clearColor(1.0,0.0,0.0,1.0); //Wyczyszczenie obrazu kolorem czerwonym
  gl.clearDepth(1.0);             //Wyczyścienie bufora głebi najdalszym planem
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shaderProgram)   //Użycie przygotowanego programu shaderowego
  
  gl.enable(gl.DEPTH_TEST);           // Włączenie testu głębi - obiekty bliższe mają przykrywać obiekty dalsze
  gl.depthFunc(gl.LEQUAL);            // 
  
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uPMatrix"), false, new Float32Array(uPMatrix)); //Wgranie macierzy kamery do pamięci karty graficznej
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix_Z"), false, new Float32Array(uMVMatrix_Z));
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix_X"), false, new Float32Array(uMVMatrix_X));
  gl.uniformMatrix4fv(gl.getUniformLocation(shaderProgram, "uMVMatrix_Y"), false, new Float32Array(uMVMatrix_Y));
  
  gl.enableVertexAttribArray(gl.getAttribLocation(shaderProgram, "aVertexPosition"));  //
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(gl.getAttribLocation(shaderProgram, "aVertexPosition"), vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numItems*vertexPositionBuffer.itemSize); //Faktyczne wywołanie rendrowania
   
}