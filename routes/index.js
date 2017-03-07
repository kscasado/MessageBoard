var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var auth = jwt({secret: 'SECRET', userProperty: 'payload'});


//get all the posts and return it as a JSON
router.get('/posts',function(req, res, next){
    Post.find(function(err,posts){
      if(err){
        console.log('cannot find posts');
        return next(err);
        }

      res.json(posts);
    });
});
//get the amount of posts the user has
router.get('/users/:user', function(req,res,next){
      User.find(function(err,user){
        if(err){
          console.log('cannot find user');
          return next(err);
        }
        res.json(user);
      })
});
//add an additional post
router.post('/posts/', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = req.payload.username;
  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });

});


//get the post id and return it as a parameter using :
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }
    console.log(post);
    req.post = post;
    return next();
  });
});

//get the comment id and return it as a parameter using :
router.param('comment', function(req, res, next, id) {
  var query =Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find post')); }

    req.comment = comment;
    return next();
  });
});
//get the user parameter
router.param('user',function(req,res,next,id){
  var query = User.findByID(id);
  query.exec(function(err,user){
    if(err){return next(err);}
    if(!user){return next(new Error('can\'t find user'));}
    req.user = user;
    return next();
  });
});

//get the page for the specific post, use the post parameter
//and use populate to get the comments from it
router.get('/posts/:post', function(req, res) {
  req.post.populate('comments', function(err,post){

    if(err){

      return next(err);}



  res.json(req.post);
  });
});


//call on the upvote method in the post to upvote a specific post
router.put('/posts/:post/upvote',auth, function(req, res, next) {
  req.post.upvote(function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

//call on the upvote method in comments to upvote a comment
router.put('/posts/:post/comments/:comment/upvote', auth,function(req, res,next){
    req.comment.upvote(function(err,comment){
    if(err) {

      return next(err);
    }
    res.json(comment);
  });
});
//user add postcount
router.post('/users/:user/addPost',function(req,res,next){
  req.user.addPostCount(function(err,user){
    if(err){
      return next(err);
    }
    res.json(user);
  });


});
//post an additional comment, using the request object
router.post('/posts/:post/comments', auth,function(req, res, next) {
    var comment = new Comment(req.body);
    comment.post = req.post;
    comment.author=req.payload.username;
    comment.save(function(err, comment){
      if(err){ return next(err); }

      req.post.comments.push(comment);
      req.post.save(function(err, post) {
        if(err){ return next(err); }

        res.json(comment);
      });
    });
  });

//register a new user
  router.post('/register', function(req, res, next){
    if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password)

    user.save(function (err){
      if(err){ return next(err); }

      return res.json({token: user.generateJWT()})
    });
  });
//post to the login and see if all fields are valid
  router.post('/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
      return res.status(400).json({message: 'Please fill out all fields'});
    }

    passport.authenticate('local', function(err, user, info){
      if(err){ return next(err); }

      if(user){
        return res.json({token: user.generateJWT()});
      } else {
        return res.status(401).json(info);
      }
    })(req, res, next);
  });



module.exports = router;
