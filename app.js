const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 10000;
var bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const fileUpload = require('express-fileupload');
app.use(fileUpload());
app.use(express.json()); // This will parse JSON data
app.use(cors());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
})
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'my-db.cl2a2s0mqxeb.ap-south-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'alps2025',
    database: process.env.DB_NAME || 'BimaScoreDB',
    port: process.env.DB_PORT || 3306
});
// Test connection
connection.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err.message);
        process.exit(1); // Exit if the connection fails
    }
    console.log("Connected to MySQL database on AWS");
});
module.exports = connection;

app.get("/api/bima-score", (req, res) => {
    const query = "SELECT * FROM PlanDataV1"; // Replace 'mytable' with the actual table name
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err.message);
            res.status(500).json({ error: "Failed to fetch data from the database" });
        } else {
            res.status(200).json(results);
        }
    });
});
app.get("/api/logo", (req, res) => {
    const limit = parseInt(req.query.limit) || 10; // Number of records to return, default 10
    const offset = parseInt(req.query.offset) || 0; // Offset for pagination, default 0

    const query = `
        SELECT p.*, l.logo_base64
        FROM PlanDataV1 p
        LEFT JOIN insurer_logos l ON p.company_name = l.company_name
        LIMIT ? OFFSET ?
    `;

    connection.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.error("Error executing query:", err.message);
            res.status(500).json({ error: "Failed to fetch data from the database" });
        } else {
            res.status(200).json(results);
        }
    });
});

// API endpoint to insert data into "getDetails" table
app.post("/api/add-detail", (req, res) => {
    const { customerName, callerName, customerEmail, customerContactNumber } = req.body;
    // Validate the input data
    if (!customerName || !callerName || !customerEmail || !customerContactNumber) {
        return res.status(400).json({ error: "All fields are required" });
    }
    // SQL query with placeholders for values
    const query = `INSERT INTO getDetails (customerName, callerName, customerEmail, customerContactNumber) 
                   VALUES (?, ?, ?, ?)`;
    // Execute the query and pass the data as an array to prevent SQL injection
    connection.query(query, [customerName, callerName, customerEmail, customerContactNumber], (err, result) => {
        if (err) {
            console.error("Error executing query:", err.message);
            return res.status(500).json({ error: "Failed to insert data into the database" });
        } else {
            res.status(201).json({ message: "Data inserted successfully", id: result.insertId });
        }
    });
});
// API endpoint to update a plan in "PlanDataV1"
app.put("/api/update-plan/:id", (req, res) => {
    const { id } = req.params;
    const {
        Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
    } = req.body;
    const query = `
        UPDATE PlanDataV1 SET 
         Company = ?, Plan = ?, Variant = ?, STANDARD_FEATURE_NAME = ?, Status = ?, Condiation = ?, Remarks = ?, RemarksForUser = ?, CheckTOrF = ?,RemarksModified = ?, PageNo = ?, BankOrRetail = ?, PolicyType = ?, Duplicate = ?, Source = ?, FinalData = ?, PlanWithVariantName = ?, PlanID = ?,VlookUp = ?, Archive = ? 
        WHERE BS_ID = ?
    `;
    connection.query(query, [
        Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
    ], (err, result) => {
        if (err) {
            console.error("Error executing query:", err.message);
            return res.status(500).json({ error: "Failed to update the plan" });
        } else {
            res.status(200).json({ message: "Plan updated successfully" });
        }
    });
});
// API endpoint to delete a plan from "PlanDataV1"
app.delete("/api/delete-plan/:id", (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM PlanDataV1 WHERE BS_ID = ?";
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error executing query:", err.message);
            return res.status(500).json({ error: "Failed to delete the plan" });
        } else {
            res.status(200).json({ message: "Plan deleted successfully" });
        }
    });
});
// API endpoint to add a new plan to "PlanDataV1"
app.post("/api/add-plan", (req, res) => {
    const {
        BS_ID, Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
    } = req.body;

    const query = `
INSERT INTO PlanDataV1 (
    BS_ID, Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condition, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;


    connection.query(query, [
        BS_ID, Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
    ], (err, result) => {
        if (err) {
            console.error("Error executing query:", err.message);
            return res.status(500).json({ error: "Failed to add the new plan" });
        } else {
            res.status(201).json({ message: "Plan added successfully" });
        }
    });
});
// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/', // Temporary folder to store uploaded files
    fileFilter: (req, file, cb) => {
        // Accept only CSV files
        if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV files are allowed.'));
        }
    }
});
app.post('/api/bulk-add-plan', (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const file = req.files.file;
    const filePath = path.join(__dirname, 'uploads', file.name);
    file.mv(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'File upload failed' });
        }
        const bulkData = [];
        console.log('File Path:', filePath);
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                bulkData.push([
                    row.BS_ID, row.Company, row.Plan, row.Variant, row.STANDARD_FEATURE_NAME, row.Status, row.Condiation, row.Remarks, row.RemarksForUser, row.CheckTOrF, row.RemarksModified, row.PageNo, row.BankOrRetail, row.PolicyType, row.Duplicate, row.Source, row.FinalData, row.PlanWithVariantName, row.PlanID, row.VlookUp, row.Archive
                ]);
            })
            .on('end', () => {
                // Ensure bulkData is not empty
                if (bulkData.length === 0) {
                    return res.status(400).json({ error: 'No valid data found in CSV' });
                }
                console.log('Bulk Data:', bulkData); // Check if data is loaded correctly
                const query = `
                INSERT INTO PlanDataV1 (
                    BS_ID, Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
                ) VALUES ?
            `;
                connection.query(query, [bulkData], (err, result) => {
                    if (err) {
                        console.error("Database insertion error:", err.message); // Log the detailed error
                        return res.status(500).json({ error: 'Database insertion failed', details: err.message });
                    }
                    res.status(201).json({ message: 'Bulk data inserted successfully', rowsInserted: result.affectedRows });
                });
            })
            .on('error', (error) => {
                console.error("File parsing error:", error.message);
                res.status(500).json({ error: 'Failed to parse CSV file' });
            });
    });
});
// API endpoint to bulk update plans based on BS_ID
app.put("/api/bulk-update-plans", (req, res) => {
    const plansToUpdate = req.body.plans; // Expecting an array of plans

    if (!plansToUpdate || !Array.isArray(plansToUpdate)) {
        return res.status(400).json({ error: "Invalid input. Expected an array of plans." });
    }

    let query = `
        UPDATE PlanDataV1 SET 
            Company = IFNULL(?, Company), 
 Plan = IFNULL(?, Plan), 
 Variant = IFNULL(?, Variant), 
 STANDARD_FEATURE_NAME = IFNULL(?, STANDARD_FEATURE_NAME),
  Status = IFNULL(?, Status), 
  Condiation = IFNULL(?, Condiation), 
  Remarks = IFNULL(?, Remarks), 
  RemarksForUser = IFNULL(?, RemarksForUser), 
  CheckTOrF = IFNULL(?, CheckTOrF), 
  RemarksModified = IFNULL(?, RemarksModified), 
  PageNo = IFNULL(?, PageNo), 
  BankOrRetail = IFNULL(?, BankOrRetail), 
  PolicyType = IFNULL(?, PolicyType), 
  Duplicate = IFNULL(?, Duplicate), 
  Source = IFNULL(?, Source), 
  FinalData = IFNULL(?, FinalData), 
  PlanWithVariantName = IFNULL(?, PlanWithVariantName), 
  PlanID = IFNULL(?, PlanID), 
  VlookUp = IFNULL(?, VlookUp), 
  Archive = IFNULL(?, Archive)
        WHERE BS_ID = ?
    `;

    // Loop through each plan and update it
    plansToUpdate.forEach((plan, index) => {
        const {
            BS_ID, Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
        } = plan;

        connection.query(query, [
            Company, Plan, Variant, STANDARD_FEATURE_NAME, Status, Condiation, Remarks, RemarksForUser, CheckTOrF, RemarksModified, PageNo, BankOrRetail, PolicyType, Duplicate, Source, FinalData, PlanWithVariantName, PlanID, VlookUp, Archive
        ], (err, result) => {
            if (err) {
                console.error(`Error updating plan with BS_ID ${BS_ID}:`, err.message);
            } else {
                console.log(`Plan with BS_ID ${BS_ID} updated successfully`);
            }

            // Send the response after the last update
            if (index === plansToUpdate.length - 1) {
                res.status(200).json({ message: "Bulk update completed successfully" });
            }
        });
    });
});
// API endpoint to bulk delete plans from "PlanDataV1"
app.delete("/api/bulk-delete-plans", (req, res) => {
    const { bsIds } = req.body; // Expecting an array of BS_IDs
    if (!bsIds || !Array.isArray(bsIds) || bsIds.length === 0) {
        return res.status(400).json({ error: "Invalid input. Expected a non-empty array of BS_IDs." });
    }

    // SQL query to delete plans where BS_ID is in the array
    const query = "DELETE FROM PlanDataV1 WHERE BS_ID IN (?)";

    connection.query(query, [bsIds], (err, result) => {
        if (err) {
            console.error("Error executing bulk delete query:", err.message);
            return res.status(500).json({ error: "Failed to delete plans from the database" });
        } else {
            res.status(200).json({
                message: "Bulk delete completed successfully",
                rowsDeleted: result.affectedRows,
            });
        }
    });
});
app.get("/api/posts", async (req, res) => {
    try {
        // Example: "SELECT * FROM blog_posts"
        const [rows] = await connection.promise().query("SELECT * FROM blog_posts");

        const transformed = rows.map((row) => {
            // If row.image_data is not null
            let imageBase64 = null;
            if (row.image_data) {
                // Convert Buffer to base64
                const base64 = Buffer.from(row.image_data).toString("base64");
                // Prepend the MIME type (assuming PNG or JPEG, whichever you are storing)
                // If you know it's always PNG, do:
                // imageBase64 = `data:image/png;base64,${base64}`;
                // If JPEG, use data:image/jpeg;base64
                // Or if you have a column for the file type, adjust accordingly
                imageBase64 = `data:image/png;base64,${base64}`;
            }

            return {
                ...row,
                imageBase64, // Return as a separate field
            };
        });

        res.json(transformed);
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).json({ error: "Database error" });
    }
});

app.put("/api/update-post/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const {
            title,
            summary,
            slug,
            published_date,
            published_time,
            content,
            tags,        // array
            imageBase64, // optional
        } = req.body;

        // Basic checks
        if (!title || !slug || !published_date || !published_time || !content) {
            return res
                .status(400)
                .json({ message: "Missing or invalid required fields" });
        }

        // Convert base64 -> buffer if present
        let imageBuffer = null;
        if (imageBase64) {
            const base64Data = imageBase64.replace(/^data:\w+\/\w+;base64,/, "");
            imageBuffer = Buffer.from(base64Data, "base64");
        }

        let updateQuery = `
        UPDATE blog_posts
        SET 
          title = ?, 
          summary = ?, 
          slug = ?, 
          published_date = ?, 
          published_time = ?, 
          content = ?
      `;
        const updateValues = [
            title,
            summary || null,
            slug,
            published_date,
            published_time,
            content,
        ];

        // If new image is present, add the clause
        if (imageBuffer) {
            updateQuery += `, image_data = ?`;
            updateValues.push(imageBuffer);
        }

        updateQuery += ` WHERE id = ?`;
        updateValues.push(postId);

        // Now run the update
        const [updateResult] = await connection
            .promise()
            .query(updateQuery, updateValues);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: "Post not found or not updated." });
        }

        // Possibly handle tags array
        // ...

        return res.json({ message: "Post updated successfully" });
    } catch (error) {
        console.error("Error updating post:", error.message);
        return res.status(500).json({ error: "Failed to update post" });
    }
});


app.delete("/api/delete-post/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        await connection.promise().query("DELETE FROM blog_posts WHERE id = ?", [postId]);
        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error deleting post:", error.message);
        res.status(500).json({ error: "Failed to delete post" });
    }
});

function getPostById(id, callback) {
    connection.query(
        "SELECT * FROM blog_posts WHERE id = ?",
        [id],
        (error, results) => {
            if (error) {
                console.error("❌ Database query error:", error);
                return callback(error, null);
            }

            if (results.length === 0) {
                return callback(null, null);
            }

            return callback(null, results[0]); // ✅ Return first row
        }
    );
}
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // result: data:*/*;base64,xxxxxx
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file); // yields "data:image/png;base64,xxxx"
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
    });
}

async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, imageBase64: base64 });
    } catch (error) {
        console.error("Error converting file to base64:", error);
    }
}

// Example: /api/create-post to store image data in LONGBLOB
app.post("/api/create-post", async (req, res) => {
    try {
        const {
            title,
            summary,
            slug,
            published_date,
            published_time,
            content,
            tags,        // can be an array or string
            imageBase64, // The base64-encoded image data from the client
        } = req.body;

        // 1) Basic validations
        if (!title || !slug || !published_date || !published_time || !content) {
            return res
                .status(400)
                .json({ message: "Missing or invalid required fields" });
        }

        // 2) Specifically require an image
        if (!imageBase64) {
            return res
                .status(400)
                .json({ message: "Image is required. Please upload an image." });
        }

        // 3) Convert base64 to a Buffer
        // Remove the `data:image/...;base64,` prefix if it exists
        const base64Data = imageBase64.replace(/^data:\w+\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        // 4) Insert into the DB
        const insertQuery = `
        INSERT INTO blog_posts 
          (title, summary, slug, published_date, published_time, content, image_data) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)
      `;

        const [insertResult] = await connection.promise().query(insertQuery, [
            title,
            summary || null,
            slug,
            published_date,
            published_time,
            content,
            imageBuffer, // LONGBLOB data
        ]);

        const postId = insertResult.insertId;

        // 5) Insert tags if needed (assuming you have a separate `tags` table or many-to-many relation)
        // Example: If `tags` is a string, convert it to an array
        // const tagList = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        // ...
        // Insert each tag into your `tags` table or `post_tags` pivot table

        return res.status(201).json({
            message: "Post created successfully with image data in LONGBLOB",
            postId,
        });
    } catch (err) {
        console.error("Error creating post with LONGBLOB image:", err.message);
        return res.status(500).json({ error: "Failed to create post" });
    }
});


app.get("/api/posts/:id", async (req, res) => {
    const postId = req.params.id;

    try {
        const [rows] = await connection
            .promise()
            .query("SELECT * FROM blog_posts WHERE id = ?", [postId]);
        if (!rows.length) {
            return res.status(404).json({ error: "Post not found" });
        }

        const post = rows[0];
        // Convert LONGBLOB -> base64 string
        let imageBase64 = "";
        if (post.image_data) {
            const prefix = "data:image/jpeg;base64,"; // or PNG or detect from DB
            imageBase64 = prefix + post.image_data.toString("base64");
        }

        // Return the rest of the post fields + the base64
        res.json({
            ...post,
            imageBase64, // or just "image_data" if you want raw
        });
    } catch (err) {
        console.error("Error fetching post:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});
// server.js or routes.js (wherever your routes are defined)
app.get("/api/posts/slug/:slug", async (req, res) => {
    const { slug } = req.params;

    try {
        // Example query: fetch by 'slug' field from your 'blog_posts' table
        const [rows] = await connection.promise().query(
            "SELECT * FROM blog_posts WHERE slug = ?",
            [slug]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "Post not found" });
        }

        const post = rows[0];

        // If you store images in LONGBLOB, convert them to base64
        let imageBase64 = "";
        if (post.image_data) {
            const prefix = "data:image/jpeg;base64,"; // or data:image/png;base64
            imageBase64 = prefix + post.image_data.toString("base64");
        }

        // Return the entire post plus the base64 image
        res.json({
            ...post,
            imageBase64,
        });
    } catch (err) {
        console.error("Error fetching post by slug:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/submit-form', (req, res) => {
    const { first_name, email, phone_number, message, services } = req.body;

    // Validate data (optional)
    if (!first_name || !email || !phone_number) {
        return res.status(400).json({ error: "All required fields must be filled." });
    }

    // Insert form data into the database
    const query = `INSERT INTO form_submissions (first_name,  email, phone_number, message, services) 
                   VALUES (?, ?, ?, ?, ?)`;

    connection.execute(query, [first_name, email, phone_number, message, JSON.stringify(services)], (err, results) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ error: "Failed to submit form data." });
        }
        return res.status(200).json({ message: "Form submitted successfully!", id: results.insertId });
    });
});



app.get("/api/testimonial", (req, res) => {
    const query = "SELECT * FROM testimonials";
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error executing query:", err.message);
            res.status(500).json({ error: "Failed to fetch data from the database" });
        } else {
            res.status(200).json(results);
        }
    });
});

app.post("/api/create-testimonial", async (req, res) => {
    try {
        const {
            name,
            location,
            subHeading,
            summary,
            slug,
            published_date,
            content,
        } = req.body;

        // 1) Basic validations
        if (!name || !slug || !location || !subHeading || !summary || !published_date || !content) {
            return res.status(400).json({ message: "Missing or invalid required fields" });
        }

        // 2) Insert into the `testimonials` table
        const insertQuery = `
        INSERT INTO testimonials 
          (name, location, subHeading, summary, slug, published_date, content) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)
      `;

        const [insertResult] = await connection.promise().query(insertQuery, [
            name,
            location,
            subHeading,
            summary,
            slug,
            published_date,
            content,
        ]);

        return res.status(201).json({
            message: "Testimonial created successfully",
            testimonialId: insertResult.insertId,
        });
    } catch (err) {
        console.error("Error creating testimonial:", err.message);
        return res.status(500).json({ error: "Failed to create testimonial" });
    }
});

app.delete("/api/delete-testimonial/:id", async (req, res) => {
    try {
        const testimonialsId = req.params.id;
        await connection.promise().query("DELETE FROM testimonials WHERE id = ?", [testimonialsId]);
        res.json({ message: "Testimonial deleted successfully!" });

        res.status(200).json({ message: "Testimonial deleted successfully!" });
    } catch (error) {
        console.error("Error deleting testimonial:", error.message);
        res.status(500).json({ error: "Failed to delete testimonial" });
    }
});
// Update a testimonial
app.put("/api/update-testimonial/:id", async (req, res) => {
    const { id } = req.params;
    const { name, location, subHeading, summary, slug, published_date, content } = req.body;

    if (!name || !location || !slug || !published_date || !content) {
        return res.status(400).json({ message: "Required fields are missing." });
    }

    try {
        const query = `
      UPDATE testimonials 
      SET name = ?, location = ?, subHeading = ?, summary = ?, slug = ?, published_date = ?, content = ?, updated_at = NOW()
      WHERE id = ?`;

        const values = [name, location, subHeading, summary, slug, published_date, content, id];

        connection.query(query, values, (err, result) => {
            if (err) {
                console.error("Error updating testimonial:", err);
                return res.status(500).json({ message: "Database error." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Testimonial not found." });
            }

            res.json({ message: "Testimonial updated successfully." });
        });
    } catch (error) {
        console.error("Error updating testimonial:", error);
        res.status(500).json({ message: "Server error." });
    }
});


app.get("/api/testimonials/:id", async (req, res) => {
    const testimonialId = req.params.id;

    try {
        const [rows] = await connection
            .promise()
            .query("SELECT * FROM testimonials WHERE id = ?", [testimonialId]);

        if (!rows.length) {
            return res.status(404).json({ error: "Testimonial not found" });
        }

        const testimonial = rows[0];

        // Convert LONGBLOB -> Base64 (if there's an image field)
        let imageBase64 = "";
        if (testimonial.image_data) {
            const prefix = "data:image/jpeg;base64,"; // Adjust if PNG or others
            imageBase64 = prefix + testimonial.image_data.toString("base64");
        }

        // Return the testimonial data along with the image
        res.json({
            ...testimonial,
            imageBase64, // Include base64 image if applicable
        });
    } catch (err) {
        console.error("Error fetching testimonial:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/testimonials/slug/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
        // Example query: fetch by 'slug' field from your 'blog_posts' table
        const [rows] = await connection.promise().query(
            "SELECT * FROM testimonials WHERE slug = ?",
            [slug]
        );

        if (!rows.length) {
            return res.status(404).json({ error: "Post not found" });
        }
        const post = rows[0];
        // Return the entire post plus the base64 image
        res.json({
            ...post,

        });
    } catch (err) {
        console.error("Error fetching post by slug:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});