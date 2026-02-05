var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')

const verifyLogin = (req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }
  else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user = req.session.user
  let cartcount = null
  if(req.session.user){
  cartcount = await userHelpers.getcartcount(req.session.user._id)
  }
  productHelpers.getallProducts().then((products)=>{
    // console.log(products)
    res.render('user/view-products',{products,user,cartcount})
  })
});

router.get('/login',(req,res)=>{
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, private");

  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    res.render('user/login',{"LoginErr":req.session.loginErr})
    req.session.loginErr = false
  }
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
  userHelpers.dosignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn = true;
    req.session.user = response;
    res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  userHelpers.dologin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
    else{
      req.session.loginErr = 'Invalid username or password'
      res.redirect("/login")
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart',verifyLogin,async(req,res)=>{
  let products =await userHelpers.getCartProducts(req.session.user._id)
  // console.log(products);
  res.render('user/cart',{products,user:req.session.user})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log('api call');
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  userHelpers.changeproductquantity(req.body).then((response)=>{
    res.json(response)
  })
})

router.post('/remove-cart-product', (req, res) => {
  userHelpers.removeCartProduct(req.body).then((response) => {
      res.json(response)
  })
})





module.exports = router;
