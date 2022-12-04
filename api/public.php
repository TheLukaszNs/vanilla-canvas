<?php

$DATA_DIR = __DIR__ . '\\data\\data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = file_get_contents('php://input');
  $file = fopen($DATA_DIR, 'w');

  if (flock($file, LOCK_EX)) {
    fwrite($file, $input);
    flock($file, LOCK_UN);
  }

  fclose($file);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!file_exists($DATA_DIR) || filesize($DATA_DIR) === 0) {
    echo json_encode(["paths" => []]);
  } else {
    echo file_get_contents($DATA_DIR);
  }
}
