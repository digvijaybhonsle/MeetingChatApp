const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next); // Catch errors and pass them to next middleware (error handler)
    };
};
export default asyncHandler;
