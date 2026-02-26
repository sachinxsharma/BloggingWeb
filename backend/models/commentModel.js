const { Schema, model } = require("mongoose")

const commentSchema = new Schema({
    text: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
}, { timestamps: true })

module.exports = model("Comment", commentSchema)
