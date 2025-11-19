-- ERD v1 SQL DDL (Postgres-like)
-- Core tables for VieGo Blog

-- Users
CREATE TABLE "users" (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP
);

-- Profiles
CREATE TABLE profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  province VARCHAR(100),
  bio TEXT
);

-- Roles & UserRoles
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE
);

-- Posts
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  author_id BIGINT NOT NULL REFERENCES users(id),
  category_id BIGINT REFERENCES categories(id),
  title VARCHAR(512) NOT NULL,
  slug VARCHAR(512) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP
);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_published_at ON posts(published_at);

-- Stories (one-to-one with posts)
CREATE TABLE stories (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  province VARCHAR(100),
  location VARCHAR(255),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Tags & PostTags
CREATE TABLE tags (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE post_tags (
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comments
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- Likes (supports like on post or comment)
CREATE TABLE likes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_likes_user_post ON likes(user_id, post_id) WHERE post_id IS NOT NULL;

-- Follows
CREATE TABLE follows (
  id BIGSERIAL PRIMARY KEY,
  follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followee_id)
);

-- Friend requests
CREATE TABLE friend_requests (
  id BIGSERIAL PRIMARY KEY,
  from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Tours
CREATE TABLE tours (
  id BIGSERIAL PRIMARY KEY,
  seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12,2),
  duration INTEGER,
  start_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE tour_images (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption VARCHAR(255)
);

-- Bookings & payments
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC(12,2),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'VND',
  status VARCHAR(32),
  provider VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Ratings (polymorphic target)
CREATE TABLE ratings (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL,
  target_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  review TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100),
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Conversations / Messages / Attachments
CREATE TABLE conversations (
  id BIGSERIAL PRIMARY KEY,
  subject VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT,
  content_type VARCHAR(50) NOT NULL DEFAULT 'text',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE attachments (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  mime_type VARCHAR(100)
);

-- Helpful indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_title ON posts(title);

-- End of DDL
