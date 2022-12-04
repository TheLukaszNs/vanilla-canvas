const sizeSlider = document.querySelector("#size");
const colorPicker = document.querySelector("#color");
const colorBadge = document.querySelector(".color__badge");
const canvas = document.getElementsByTagName("canvas")[0];
/** @type HTMLCanvasElement */
const canvasGhost = document.querySelector("#ghost-canvas");
const modeButtons = document.querySelectorAll(".button__mode");

const ctx = canvas.getContext("2d");
const ctxGhost = canvasGhost.getContext("2d");

const rescaleCanvas = () => {
  const scale = window.devicePixelRatio;

  canvas.width = canvas.clientWidth * scale;
  canvas.height = canvas.clientHeight * scale;

  canvasGhost.width = canvas.width;
  canvasGhost.height = canvas.height;

  ctx.scale(scale, scale);
  ctxGhost.scale(scale, scale);
};

rescaleCanvas();

const state = {
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  color: colorPicker.value,
  brushSize: sizeSlider.value,
  mode: "drawing",
  paths: [],
  activePath: [],
  redoStack: [],
};

/**
 * @param {typeof state} initialState
 */
const setup = (initialState) => {
  changeMode(initialState.mode);
  sizeSlider.value = initialState.brushSize;
  colorPicker.value = initialState.color;
  colorBadge.style.backgroundColor = initialState.color;
  sizeSlider.style.accentColor = initialState.color;
};

const setStrokeStyle = ({ color, brushSize } = {}) => {
  ctx.strokeStyle = color ?? state.color;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = brushSize ?? state.brushSize;

  ctxGhost.strokeStyle = color ?? state.color;
  ctxGhost.lineJoin = "round";
  ctxGhost.lineCap = "round";
  ctxGhost.lineWidth = brushSize ?? state.brushSize;
  ctxGhost.setLineDash([5, (3 / 2) * (brushSize ?? state.brushSize)]);
};

/**
 * @param {TouchEvent} e
 */
const handleTouchStart = (e) => {
  const touch = e.touches[0];

  state.isDrawing = true;
  state.activePath = [];
  state.redoStack = [];

  setStrokeStyle();

  ctxGhost.beginPath();
  ctxGhost.moveTo(touch.clientX, touch.clientY);

  state.activePath.push({
    x: touch.clientX,
    y: touch.clientY,
  });
};

/**
 * @param {TouchEvent} e
 */
const handleTouchMove = (e) => {
  if (!state.isDrawing) return;

  const touch = e.touches[0];

  if (state.mode === "drawing") {
    state.activePath.push({
      x: touch.clientX,
      y: touch.clientY,
    });

    ctxGhost.lineTo(touch.clientX, touch.clientY);
    ctxGhost.stroke();
  }

  if (state.mode === "line") {
    clearGhostCanvas();

    state.activePath = [
      state.activePath[0],
      { x: touch.clientX, y: touch.clientY },
    ];

    ctxGhost.beginPath();
    ctxGhost.moveTo(state.activePath[0].x, state.activePath[0].y);
    ctxGhost.lineTo(touch.clientX, touch.clientY);
    ctxGhost.stroke();
  }

  if (state.mode === "circle") {
    clearGhostCanvas();

    const { x: x1, y: y1 } = state.activePath[0];
    const { x: x2, y: y2 } = { x: touch.clientX, y: touch.clientY };

    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    state.activePath = [state.activePath[0], { x: radius, y: radius }];

    ctxGhost.beginPath();
    ctxGhost.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctxGhost.stroke();
  }

  state.lastX = touch.clientX;
  state.lastY = touch.clientY;
};

/**
 * @param {TouchEvent} e
 */
const handleTouchEnd = (e) => {
  ctxGhost.closePath();

  flushBuffer();
  state.isDrawing = false;
};

const flushBuffer = () => {
  clearGhostCanvas();
  state.paths.push({
    path: state.activePath,
    color: state.color,
    brushSize: state.brushSize,
    mode: state.mode,
  });

  draw();
};

const clearGhostCanvas = () => {
  ctxGhost.clearRect(0, 0, canvas.width, canvas.height);
};

const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  state.paths.forEach(({ path, color, brushSize, mode }) => {
    setStrokeStyle({ color, brushSize });
    ctx.beginPath();

    if (mode === "circle") {
      const [mid, { x: radius }] = path;

      ctx.arc(mid.x, mid.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else {
      ctx.moveTo(path[0].x, path[0].y);

      path.forEach((point) => {
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      });
    }

    ctx.closePath();
  });
};

const undo = () => {
  if (state.paths.length === 0) return;

  state.redoStack.push(state.paths.pop());
  draw();
};

const redo = () => {
  if (state.redoStack.length === 0) return;

  state.paths.push(state.redoStack.pop());
  draw();
};

const clearDrawing = () => {
  state.paths = [];
  state.redoStack = [];
  draw();
};

/**
 *
 * @param {'drawing' | 'line' | 'circle'} mode
 */
const changeMode = (mode) => {
  state.mode = mode;

  modeButtons.forEach((button) => {
    if (button.dataset.mode === mode) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
};

canvas.addEventListener("touchstart", handleTouchStart);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchEnd);

sizeSlider.addEventListener("input", (e) => {
  state.brushSize = e.target.value;
});

colorPicker.addEventListener("input", (e) => {
  state.color = e.target.value;
  colorBadge.style.backgroundColor = state.color;
  sizeSlider.style.accentColor = state.color;
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    changeMode(button.dataset.mode);
  });
});

screen.orientation.onchange = rescaleCanvas;

setup(state);
