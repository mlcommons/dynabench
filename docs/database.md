# Setting up your database

**Recommended:** Use Docker with MySQL 8.4 as described in the [main setup guide](setup_guide.md). This is the easiest and most reliable method.

## Alternative: Local MySQL 8.4 installation

If you prefer to install MySQL locally instead of using Docker:

**Mac OS X** (using [homebrew](https://docs.brew.sh/Installation)):
```
brew install mysql@8.4
brew services start mysql@8.4
```

**Ubuntu/Debian**:
```
sudo apt update
sudo apt install mysql-server-8.4
sudo systemctl start mysql
```

**Other platforms:** Follow the [official MySQL 8.4 installation guide](https://dev.mysql.com/doc/refman/8.4/en/installing.html)

## Configuration

Next, we need to create a database and user for dynabench to use. Enter the MySQL shell:

```
mysql -u root -p
```

Input the following SQL commands to create the `dynabench` user:

```
CREATE USER 'dynabench'@'localhost' IDENTIFIED BY 'ENTER_YOUR_PASSWORD';
CREATE DATABASE dynabench;
GRANT ALL PRIVILEGES ON dynabench.* TO 'dynabench'@'localhost';
```


For database access, we recommend using the DBeaver viewer.
