const getData = (cb) => {
  const request = new XMLHttpRequest();

  request.open("GET", "api/public.php", true);
  request.setRequestHeader("Cache-Control", "no-cache");
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      const data = JSON.parse(request.responseText);

      cb(data);
    }
  };
  request.send();
};

const postData = (data, cb) => {
  const request = new XMLHttpRequest();

  request.open("POST", "api/public.php", true);
  request.setRequestHeader("Content-Type", "application/json");
  request.onload = () => {
    if (request.status >= 200 && request.status < 400) {
      cb?.();
    }
  };
  request.send(JSON.stringify({ paths: data }));
};

const clearServer = () => {
  clearDrawing();
  postData([]);
};

document.addEventListener("DOMContentLoaded", () => {
  const getDataRedraw = (data) => {
    state.paths = data.paths;
    draw();
  };

  getData(getDataRedraw);

  setInterval(() => {
    getData(getDataRedraw);
  }, 1000);
});

canvas.addEventListener("touchend", () => {
  postData(state.paths);
});
