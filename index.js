import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "cryptochatter",
    password: "password", // adjust the password
    port: 5432,
});
db.connect();

async function setupTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(50) NOT NULL,
                content TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS replies (
                id SERIAL PRIMARY KEY,
                post_id INT,
                reply TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );
        `;

        await db.query(query);
        console.log("Table 'posts' and 'replies' created or already exists.");
    } catch (error) {
        console.log("Error creating table: ", error.message);
    }
}

async function getPosts() {
    try {
        const query = `SELECT * FROM posts ORDER BY id DESC`;
        const result = await db.query(query);

        if (result.rowCount !== 0) {
            const posts = result.rows.map((row) => {
                return {
                    id: row.id,
                    title: row.title,
                    content: row.content
                }
            });
            console.log("Fetched data from table 'posts' successfully.");
            return posts;
        }

        console.log("Table 'posts' is empty.");
    } catch (error) {
        console.log("Error fetching data from table 'posts': ", error.message);
    }
}

async function getReplies() {
    try {
        const query = `SELECT * FROM replies`;
        const result = await db.query(query);

        if (result.rowCount !== 0) {
            const replies = result.rows.map((row) => {
                return {
                    id: row.id,
                    post_id: row.post_id,
                    reply: row.reply
                }
            });
            console.log("Fetched data from table 'replies' successfully.");
            return replies;
        }

        console.log("Table 'replies' is empty.");
    } catch (error) {
        console.log("Error fetching data from table 'replies': ", error.message);
    }
}

async function getSpecificPost(id) {
    try {
        const query = `SELECT * FROM posts WHERE id = $1`;
        const result = await db.query(query, [id]);

        if (result.rowCount !== 0) {
            const post = result.rows.map((row) => {
                return {
                    id: row.id,
                    title: row.title,
                    content: row.content
                }
            });
            console.log("Fetched specific data from table 'posts' successfully.");
            return post[0];
        }

        console.log("Table 'posts' is empty");
    } catch (error) {
        console.log("Error fetching specific data from table 'posts': ", error.message);
    }
}

async function getRepliesByPostId(id) {
    try {
        const query = `SELECT * FROM replies WHERE post_id = $1`;
        const result = await db.query(query, [id]);

        if (result.rowCount !== 0) {
            const posts = result.rows.map((row) => {
                return {
                    id: row.id,
                    post_id: row.post_id,
                    reply: row.reply
                }
            });
            console.log("Fetched specific data from table 'replies' successfully.");
            return posts;
        }

        console.log("Table 'replies' is empty");
    } catch (error) {
        console.log("Error fetching specific data from table 'replies': ", error.message);
    }
}

// uncomment the code below and run if first time starting the program
// await setupTable();

app.get("/", async (req, res) => {
    const posts = await getPosts();
    const replies = await getReplies();
    res.render("index.ejs", {
        posts, replies
    });
})

app.get("/post/:id", async (req, res) => {
    const id = req.params.id;
    const post = await getSpecificPost(id);
    const replies = await getRepliesByPostId(id);
    console.log("Post: \n", post);
    console.log("Replies: \n", replies);
    res.render("post.ejs", {
        post, replies
    });
})

app.get("/create", async (req, res) => {
    res.render("create_post.ejs");
})

app.post("/posts", async (req, res) => {
    try {
        const title = req.body.title;
        const content = req.body.content;
        const query = `INSERT INTO posts (title, content) VALUES ($1, $2)`;
        await db.query(query, [title, content]);
        console.log("Post inserted to table 'posts' successfully.");
        res.redirect("/");
    } catch (error) {
        console.log("Error inserting post into table 'posts': ", error.message);
    }
})

app.post("/reply", async (req, res) => {
    try {
        const post_id = req.body.post_id;
        const reply = req.body.reply;
        const query = `INSERT INTO replies (post_id, reply) VALUES ($1, $2)`;
        await db.query(query, [post_id, reply]);
        console.log("Reply inserted to table 'replies' successfully.");
        res.redirect(`/post/${post_id}`);
    } catch (error) {
        console.log("Error inserting reply into table 'replies': ", error.message);
    }
})

app.listen(port, () => {
    console.log(`Listing on port ${port}.`);
})
