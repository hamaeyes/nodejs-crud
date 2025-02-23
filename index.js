import express from 'express';
import mysql from 'mysql2';

const app = express();

// MySQL 연결 
const connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root!",
    database: "mysite",
  });

app.use(express.json());


app.get('/',(req,res)=>{
    res.send("Hello, World!!");
});

// 유저 등록
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

  // 유저 목록 조회 
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

// 유저 정보 조회 
app.get("/users/:id", async(req, res) => {
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

// 유저 정보 업데이트 
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

  // 유저 정보 삭제 
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

app.listen(8000,()=>{
    console.log("Server listening in http://localhost:8000")
});