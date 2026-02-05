var db = require('../config/connection')
var collection = require('../config/collection')
const { reject, resolve } = require('promise')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
module.exports = {
    dosignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(userData)
            })
        })
    },
    dologin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log("login success");
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("login failed 1");
                        resolve({status:false})
                    }
                })
            }
            else {
                console.log("login failed 2");
                resolve({status : false})
            }
        })
    },
    addToCart:(prodId,userId)=>{
        let proObj = {
            item : new objectId(prodId),
            quantity: 1
        }
        return new Promise(async(resolve,reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){
                let proexist = userCart.products.findIndex(product=> product.item == prodId)
                // console.log(proexist);
                if(proexist!=-1){
                    console.log(proexist);
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId),'products.item': new objectId(prodId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }
                else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user: new objectId(userId)},
                {
                    $push:{products:proObj}
                }).then((response)=>{
                    resolve()
                })
                }
            }
            else{
                let cartObj ={
                    user: new objectId(userId),
                    products : [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        cartId: '$_id',
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project:{
                        cartId: 1,item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{prodList : "$products"},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$prodList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
        })
    },
    getcartcount:(userid)=>{
        return new Promise (async(resolve,reject)=>{
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectId( userid)})
            console.log(cart);
            if(cart){
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeproductquantity:(details)=>{
        details.count = parseInt(details.count)
        // console.log(details);
        return new Promise(async(resolve,reject)=>{
            // if quantity becomes zero → remove product
        if (details.count === -1 && details.quantity === 1) {

            await db.get().collection(collection.CART_COLLECTION).updateOne(
                { _id: new objectId(details.cart) },
                {
                    $pull: { products: { item: new objectId(details.product) } }
                }
            )

            resolve({ removeProduct: true })
        }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:new objectId(details.cart),'products.item': new objectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }).then((response)=>{
                        console.log(response)
                        resolve({status:true})
                    })}
        })
    },
    removeCartProduct: (details) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).updateOne(
                { _id: new objectId(details.cart) },
                {
                    $pull: { products: { item: new objectId(details.product) } }
                }
            )
            resolve({ status: true })
        })
    }
    
}