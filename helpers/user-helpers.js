var db = require('../config/connection')
var collection = require('../config/collection')
const { reject, resolve } = require('promise')
const bcrypt = require('bcrypt')
const { response } = require('express')
const Razorpay = require('razorpay')
var instance = new Razorpay({ key_id: 'rzp_test_SGnIIaeWqZoOyJ', key_secret: 'j2O3xGMmzXr7gwGUdfqz5R3l' })
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
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log("login failed 2");
                resolve({ status: false })
            }
        })
    },
    addToCart: (prodId, userId) => {
        let proObj = {
            item: new objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userId) })
            if (userCart) {
                let proexist = userCart.products.findIndex(product => product.item == prodId)
                // console.log(proexist);
                if (proexist != -1) {
                    console.log(proexist);
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectId(userId), 'products.item': new objectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                }
                else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: new objectId(userId) },
                        {
                            $push: { products: proObj }
                        }).then((response) => {
                            resolve()
                        })
                }
            }
            else {
                let cartObj = {
                    user: new objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        cartId: '$_id',
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        cartId: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
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
    getcartcount: (userid) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new objectId(userid) })
            console.log(cart);
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeproductquantity: (details) => {
        details.count = parseInt(details.count)
        // console.log(details);
        return new Promise(async (resolve, reject) => {
            // if quantity becomes zero → remove product
            if (details.count === -1 && details.quantity === 1) {

                await db.get().collection(collection.CART_COLLECTION).updateOne(
                    { _id: new objectId(details.cart) },
                    {
                        $pull: { products: { item: new objectId(details.product) } }
                    }
                )

                resolve({ removeProduct: true })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: new objectId(details.cart), 'products.item': new objectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }).then((response) => {
                        console.log(response)
                        resolve({ status: true })
                    })
            }
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
    },
    gettotalamount:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        cartId: '$_id',
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        cartId: 1, item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt: '$quantity' },{$toInt: '$product.Price'}]}}
                    }
                }
                
            ]).toArray()
            // console.log();
            if(total.length>0){
                resolve(total[0].total)
            }
            else{
                resolve(0)
            }

                
        })
    },

    placeorder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            // console.log(order,products,total);
            let status = order['payment-method']==='COD'?'placed':'pending'
            let orderObj = {
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:new objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:new objectId(order.userId)})
                // console.log(response.insertedId)
                resolve(response.insertedId)
            })
        })
    },

    getCartProductsList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user: new objectId(userId)})
            resolve(cart.products)
        })
    },

    getOrderdetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({userId: new objectId(userId)}).toArray()
            // console.log(orders);
            resolve(orders)
        })
    },

    getOrderProduct:(orderId)=>{
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: new objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
                
            ]).toArray()
            // console.log();
            if(orderItems.length>0){
                resolve(orderItems)
            }
            else{
                resolve(0)
            }

                
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: total*100,
                currency: "INR",
                receipt: orderId,
            };
            instance.orders.create(options, function(err, order){
                   console.log("new order:",order);
                   resolve(order)
                })
        })
    },

    verifyPayment:(details)=>{
        return new Promise ((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256','j2O3xGMmzXr7gwGUdfqz5R3l')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if(hmac == details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }

        })
    },

    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:new objectId(orderId)},
            {
                $set:{
                    status:"placed"
                }
            }).then(()=>{
                
                resolve()
            })
        })
    }

}