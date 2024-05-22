-- CREATE TABLE users (
--     id CHAR(36) PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     password VARCHAR(255) NOT NULL,
--     account_type INT NOT NULL
-- );
-- CREATE TABLE wallets (
--     id CHAR(36) PRIMARY KEY,
--     currency VARCHAR(255) NOT NULL,
--     value DOUBLE NOT NULL,
--     userid CHAR(36),
--     FOREIGN KEY (userid) REFERENCES users(id)
-- );
-- CREATE TABLE exchangerates (
--     id CHAR(36) PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     value DOUBLE NOT NULL
-- )

SELECT *
FROM wallets;
SELECT *
FROM users;
SELECT *
FROM exchangerates;

-- DELETE FROM wallets WHERE id = '3f446c6d-1d94-4200-a708-ee47148a73ac'

-- Add ExchangeRate
-- INSERT INTO exchangerates (name, value)
-- VALUES ('XRP', 10)
-- INSERT INTO exchangerates (name, value)
-- VALUES ('PND', 10)

DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS exchangerates;