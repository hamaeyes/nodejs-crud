# nodejs-crud

Express 웹프레임워크를 이용해서 웹서버를 띄우고 MySQL 데이터베이스에 등록,조회,업데이트,삭제 전문을 간단하게 만들어 본다. 

## Express Server를 띄워보자.

아래의 소스코드는 간단하게 Hello, World 문자열을 출력하는 코드이다. 

```
import express from 'express';
const app = express();

app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Hello, World!!");
});

app.listen(8000,()=>{
    console.log("Server listening in http://localhost:8000")
});
```

curl로 호출해 보자. 아래와 같이 나온다면 성공한것이다.

```
$ curl http://localhost:8000
Hello, World!!                                                                                                                          
$
```

## MySQL를 구성하고 테이블을 생성하자.

MySQL을 생성하자.

```
// docker-compose.yml
version: '3'
services:
 mysite-db:
    image: mysql:latest
    environment:
      MYSQL_DATABASE: 'mysite'
      MYSQL_USER: 'user'
      MYSQL_PASSWORD: 'password'
      MYSQL_ROOT_PASSWORD: 'root!'
    ports:
      - '3306:3306'
    volumes:
      - 'mysqldata:/var/lib/mysql'
volumes:
    mysqldata:
```

  
테이블을 구성하자. 

```
// users.sql
CREATE TABLE `users` (
 `id` int NOT NULL AUTO_INCREMENT,
 `name` varchar(255) DEFAULT NULL,
 `address` varchar(255) DEFAULT NULL,
 `country` varchar(255) DEFAULT NULL,
 PRIMARY KEY (`id`)
)
```

## Express Server에서 MySQL을 연결해보자

mysql2를 package.json에 추가해야 한다. 

아래의 설정은 mysql 커넥션을 10개(기본값)을 생성한다는 의미이고 DB 연결이 필요하면 10개의 커넥션 중 하나를 내여준다. 

```
import mysql from 'mysql2';

// connecting Database
const connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root!",
    database: "mysite",
  });
```

## 유저를 등록하는 전문을 만들자

유저를 등록하는 요청을 처리하자.

```
app.post("/users", async (req, res) => {
    try {
      const { name, address, country } = req.body;
      const [{ insertId }] = await connection.promise().query(
        `INSERT INTO users (name, address, country) 
            VALUES (?, ?,?)`,
        [name, address, country]
      );
      res.status(202).json({
        message: "User Created",
      });
    } catch (err) {
      res.status(500).json({
        message: err,
      });
    }
});
```

curl 명령어로 테스트 해보자.

```
$ curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"bong","address":"Seoul","country":"South Korea"}' \
     http://localhost:8000/users
{"message":"User Created"}
$
```

데이터베이스에 저장되었는지 확인한다.

```
mysql> select * from users;
Empty set (0.00 sec)

mysql> select * from users;
+----+------+---------+-------------+
| id | name | address | country     |
+----+------+---------+-------------+
|  1 | bong | Seoul   | South Korea |
+----+------+---------+-------------+
1 row in set (0.00 sec)

mysql>
```

## 유저목록을 조회하는 전문을 추가하자.

```
app.get("/users", async(req, res) => {
    try {
        const data = await connection.promise().query(
          `SELECT *  from users;`
        );
        res.status(202).json({
          users: data[0],
        });
      } catch (err) {
        res.status(500).json({
          message: err,
        });
      }
});
```

curl 명령어로 테스트 해보자

```
$ curl -X GET \
     -H "Content-Type: application/json" \
     http://localhost:8000/users
{"users":[{"id":1,"name":"bong","address":"Seoul","country":"South Korea"}]}
$
```

## 특정 유저의 상세정보를 확인하자. 

```
app.get("/user/:id", async(req, res) => {
    try {
        const {id} = req.params
        const data = await connection.promise().query(
          `SELECT *  from users where id = ?`,[id]
        );
        res.status(200).json({
          user: data[0][0],
        });
      } catch (err) {
        res.status(500).json({
          message: err,
        });
      }
});
```

curl 명령어로 테스트 해보자.

```
$ curl -X GET \
     -H "Content-Type: application/json" \
     http://localhost:8000/users/1
{"user":{"id":1,"name":"bong","address":"Seoul","country":"South Korea"}}
$
```

## 특정 유저의 상세정보를 업데이트 하자

```
app.patch("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, country } = req.body;
      const update = await connection
        .promise()
        .query(
          `UPDATE users set name = ?, address = ?, country = ? where id = ?`,
          [ name, address, country,id]
        );
      res.status(200).json({
        message: "updated",
      });
    } catch (err) {
      res.status(500).json({
        message: err,
      });
    }
  });
```

curl 명령어로 테스트 해보자. 

```
$ curl -X PATCH \
     -H "Content-Type: application/json" \
     -d '{"name":"bg.choi","address":"Seoul","country":"South Korea"}' \
     http://localhost:8000/users/1
{"message":"updated"}
$
```

db 정보가 바뀌었는지 확인해 보자.

```
mysql> select * from users;
+----+------+---------+-------------+
| id | name | address | country     |
+----+------+---------+-------------+
|  1 | bong | Seoul   | South Korea |
+----+------+---------+-------------+
1 row in set (0.00 sec)

mysql> select * from users;
+----+---------+---------+-------------+
| id | name    | address | country     |
+----+---------+---------+-------------+
|  1 | bg.choi | Seoul   | South Korea |
+----+---------+---------+-------------+
1 row in set (0.00 sec)

mysql>
```

## 유저를 삭제 해보자

```
app.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const update = await connection
        .promise()
        .query(
          `DELETE FROM  users where id = ?`,
          [id]
        );
      res.status(200).json({
        message: "deleted",
      });
    } catch (err) {
      res.status(500).json({
        message: err,
      });
    }
  });
```

curl 명령어로  테스트 해보자 

```
$ curl -X DELETE \
     -H "Content-Type: application/json" \
     http://localhost:8000/users/1
{"message":"deleted"}
$
```

db 정보가 바뀌었는지 확인해 보자.

```
mysql> select * from users;
+----+---------+---------+-------------+
| id | name    | address | country     |
+----+---------+---------+-------------+
|  1 | bg.choi | Seoul   | South Korea |
+----+---------+---------+-------------+
1 row in set (0.00 sec)

mysql> 
mysql> select * from users;
Empty set (0.00 sec)

mysql>
```

## 마치며

express + mysql2를 이용해서 간단한 CRUD작업을 하는 코드를 만들어 봤다.

mysql2 모듈은 transaction, pool관리도 해주기 때문에 필요하면 적용하면 되겠다.