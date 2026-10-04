CREATE DATABASE IF NOT EXISTS db_kasir;
USE db_kasir;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','kasir') NOT NULL DEFAULT 'kasir',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode VARCHAR(30) NOT NULL UNIQUE,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  harga INT NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_transaksi VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  total INT NOT NULL,
  bayar INT NOT NULL,
  kembalian INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  product_id INT NOT NULL,
  nama_produk VARCHAR(150) NOT NULL,
  harga INT NOT NULL,
  qty INT NOT NULL,
  subtotal INT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (kode, nama, kategori, harga, stok) VALUES
('KB-001','Keyboard Mechanical Rexus','Keyboard',450000,20),
('MS-001','Mouse Wireless Logitech M331','Mouse',185000,30),
('MN-001','Monitor LED 24 inch','Monitor',1450000,10),
('SSD-001','SSD NVMe 512GB','Storage',650000,25),
('RAM-001','RAM DDR4 8GB','Memori',380000,40),
('HD-001','Headset Gaming','Aksesoris',275000,15),
('WC-001','Webcam Full HD','Aksesoris',320000,12),
('CB-001','Kabel HDMI 1.5m','Kabel',45000,50);users