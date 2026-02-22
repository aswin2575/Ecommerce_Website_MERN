const { reject, resolve } = require('promise')
var db = require('../config/connection')
var collection = require('../config/collection')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct:(product,callback)=>{
        //console.log(product)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            console.log(data)
            //console.log(data.insertedId)
            callback(data.insertedId.toString())
        })
    },
    getallProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products =await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteproduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getproductdetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: new objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },

    updateproduct:(proId,prodetails)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: new objectId(proId)},{
                $set:{
                    Name:prodetails.Name,
                    Description:prodetails.Description,
                    Category:prodetails.Category,
                    Price : prodetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    allOrderDetails:()=>{
        return new Promise (async(resolve,reject)=>{
            order = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(order)
        })
    }

}