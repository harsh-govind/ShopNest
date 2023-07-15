const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');


//create new order

exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body;
    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    });
    res.status(201).json({
        success: true,
        order
    });
});

//get single order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
        return next(new ErrorHandler('No Order found with this ID', 404));
    }
    res.status(200).json({
        success: true,
        order
    });
});

//get logged in user orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({
        user: req.user.id
    });
    res.status(200).json({
        success: true,
        orders
    });
});

//get all orders - ADMIN
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();
    let totalAmount = 0;
    orders.forEach(order => {
        totalAmount += order.totalPrice;
    });
    res.status(200).json({
        success: true,
        totalAmount,
        orders
    });
});

//update / process order - ADMIN
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler('No Order found with this ID', 404));
    }
    if (order.orderStatus === 'Delivered') {
        return next(new ErrorHandler('You have already delivered this order', 400));
    }
    order.orderItems.forEach(async item => {
        await updateStock(item.product, item.quantity);
    });
    order.orderStatus = req.body.status;
    if (req.body.status === 'Delivered') {
        order.deliveredAt = Date.now();
    }
    await order.save({ validateBeforeSave: false });
    res.status(200).json({
        success: true
    });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    product.stock = product.stock - quantity;
    await product.save({
        validateBeforeSave: false
    });
}

//delete order - ADMIN
// exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//         return next(new ErrorHandler('No Order found with this ID', 404));
//     }
//     await order.remove();
//     res.status(200).json({
//         success: true
//     });
// });

exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const result = await Order.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
        return next(new ErrorHandler('No Order found with this ID', 404));
    }
    res.status(200).json({
        success: true
    });
});
