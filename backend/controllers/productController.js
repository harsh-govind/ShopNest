const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");

//create product -- admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
    req.body.user = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product,
    });
});


//get all products
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
    const resPerPage = 8;
    const productCount = await Product.countDocuments();

    const apiFeature = new ApiFeatures(Product.find(), req.query).search().filter().pagination(resPerPage);

    const products = await apiFeature.query;
    res.status(200).json({
        success: true,
        products,
        productCount,
    });
});

exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        product,
    });
});


// Update product -- admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });


    res.status(200).json({
        success: true,
        product,
    });
});


// Delete product -- admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // await product.remove();
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({
        success: true,
        message: "Product is deleted",
    });
});


// Create new review or update the review -- user
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
    const { rating, comment, productId } = req.body;
    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    };

    const product = await Product.findById(productId);
    const isReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
    );

    if (isReviewed) {
        product.reviews.forEach((review) => {
            if (review.user.toString() === req.user._id.toString()) {
                review.comment = comment;
                review.rating = rating;
            }
        });
    }
    else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avg = 0;
    product.reviews.forEach((review) => {
        avg += review.rating;
    });

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    });
});

// Get product reviews -- user
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.id);

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
        success: true,
        reviews: product.reviews,
    });

});

// Delete product review-- user
// exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
//     const product = await Product.findById(req.query.productId);
//     if (!product) {
//         return next(new ErrorHandler("Product not found", 404));
//     }

//     const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
//     let avg = 0;
//     reviews.forEach((review) => {
//         avg += review.rating;
//     });

//     const ratings = avg / reviews.length;
//     const numOfReviews = reviews.length;

//     await Product.findByIdAndUpdate(req.query.productId, {
//         reviews,
//         ratings,
//         numOfReviews
//     }, {
//         new: true,
//         runValidators: true,
//         useFindAndModify: false,
//     });

//     res.status(200).json({
//         success: true,
//         message: "Review deleted successfully",
//     });

// });

exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    let avg = 0;
    reviews.forEach((review) => {
        avg += review.rating;
    });

    const numOfReviews = reviews.length;
    const ratings = numOfReviews > 0 ? avg / numOfReviews : 0;

    product.reviews = reviews;
    product.ratings = ratings;
    product.numOfReviews = numOfReviews;

    await product.save();

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
    });
});
