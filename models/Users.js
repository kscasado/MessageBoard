var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var UserSchema = new mongoose.Schema({
  username:{type:String,lowercase:true,unique:true},
  hash:String,
  salt:String,
  posts:{type:Number, default:0}

});
UserSchema.methods.addPostCount=function(){
  this.posts+=1;
};
UserSchema.methods.setPassword=function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password,this.salt,1000,64).toString('hex');


};
UserSchema.methods.validPassword=function(password){
  var hash=crypto.pbkdf2Sync(password,this.salt,1000,64).toString('hex');
  return this.hash===hash;
};
UserSchema.methods.generateJWT = function(){
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate()+60);
  return jwt.sign({
    _id:this._id,
    username:this.username,
    posts:this.posts,
    exp: parseInt(exp.getTime()/1000),
  }, 'SECRET');

};
mongoose.model('User',UserSchema);
