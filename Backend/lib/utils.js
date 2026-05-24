import jwt from 'jsonwebtoken';

const genToken = ((userID,res)=>{
    const token = jwt.sign({userID},process.env.SECRET_KEY,{
                expiresIn:'7d'
    })
    res.cookie('jwt',token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true,
        sameSite:'strict',
        secure:true
    })
    console.log("workiing")
    return token;
})

export default genToken