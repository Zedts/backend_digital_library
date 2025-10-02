CREATE TABLE Users (
  users_id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'users' CHECK (role IN ('admin', 'users')),
  created_date DATETIME DEFAULT GETDATE(),
  updated_date DATETIME DEFAULT GETDATE()
);

CREATE TABLE Categories (
  category_id INT IDENTITY(1,1) PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL
);

CREATE TABLE Books (
  book_id INT IDENTITY(1,1) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  author VARCHAR(150),
  publisher VARCHAR(150),
  publish_year INT,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE BookImages (
  image_id INT IDENTITY(1,1) PRIMARY KEY,
  book_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL, 
  is_primary BIT DEFAULT 0, 
  uploaded_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

CREATE TABLE Borrowings (
  borrowing_id INT IDENTITY(1,1) PRIMARY KEY,
  users_id INT NOT NULL,             
  book_id INT NOT NULL,
  borrow_date DATE,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Borrowed', 'Returned', 'Extended')),
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id)
);

CREATE TABLE Returns (
  return_id INT IDENTITY(1,1) PRIMARY KEY,
  borrowing_id INT NOT NULL,
  return_date DATE NOT NULL,
  fine DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (borrowing_id) REFERENCES Borrowings(borrowing_id)
);

CREATE TABLE Register (
  register_id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  requested_role VARCHAR(20) DEFAULT 'users' CHECK (requested_role IN ('users')), 
  register_date DATETIME DEFAULT GETDATE(),
  updated_date DATETIME DEFAULT GETDATE(),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TABLE Ratings (
  rating_id INT IDENTITY(1,1) PRIMARY KEY,
  users_id INT NOT NULL,     
  book_id INT NOT NULL,     
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rating_date DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  CONSTRAINT UQ_UserBook UNIQUE (users_id, book_id)
);

CREATE TABLE Bookmarks (
  bookmark_id INT IDENTITY(1,1) PRIMARY KEY,
  users_id INT NOT NULL,
  book_id INT NOT NULL,
  bookmark_date DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (users_id) REFERENCES Users(users_id),
  FOREIGN KEY (book_id) REFERENCES Books(book_id),
  CONSTRAINT UQ_UserBookBookmark UNIQUE (users_id, book_id)
);

-- Insert default admin user with MD5 hashed password
INSERT INTO Users (name, email, password, role, created_date, updated_date) 
VALUES (
  'Admin', 
  'admin@digitallibrary.com', 
  CONVERT(VARCHAR(32), HASHBYTES('MD5', 'admin'), 2), 
  'admin', 
  GETDATE(), 
  GETDATE()
);
