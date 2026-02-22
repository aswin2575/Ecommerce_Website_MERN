var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getallProducts().then((products)=>{
    //console.log(products)
    res.render('admin/view-products',{admin : true,products})
  })
});
router.get('/add-product', function(req, res) {
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  // console.log(req.body)
  // console.log(req.files.image)

  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.image
    //console.log(id)
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/add-product')
      }
      else{
        console.log(err)
      }
    })
  })
})
router.get('/delete-product/:id',(req,res)=>{
  let proId = req.params.id;
  productHelpers.deleteproduct(proId).then((response)=>{
    res.redirect("/admin/")
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product = await productHelpers.getproductdetails(req.params.id)
  // console.log(product);
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id', (req,res)=>{
  let id = req.params.id;
  productHelpers.updateproduct(req.params.id, req.body).then(()=>{
    res.redirect('/admin')
    if(req.files && req.files.image){
      let im = req.files.image
      im.mv('./public/product-images/'+id+'.jpg')
    }
  })
})

router.get('/allOrders', async(req,res)=>{
  let orderedProducts = await userHelpers.getAllOrdersDetailed()
  console.log(orderedProducts[0].products);
  res.render('admin/view-orders',{admin : true,orderedProducts})
  
})

router.get('/allUsers',(req,res)=>{
  res.render('admin/view-users')
})

module.exports = router;
