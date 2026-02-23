const { Router } = require('express')
const {
    CreatePost,
    getCatPosts,
    getPosts,
    getSinglePost,
    getUserPosts,
    editPost,
    deletePost

} = require("../controllers/postController")
const authMiddleware = require('../middleware/authMiddleware');


const router = Router()

router.post('/', authMiddleware, CreatePost);
router.get('/', getPosts);
router.get('/:id', getSinglePost);
router.get('/categories/:category', getCatPosts);
router.get('/users/:id', getUserPosts);
router.patch('/:id', authMiddleware, editPost);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router 