import {decode, verify,sign } from "jsonwebtoken";

const secret = "dededafsehb";
const token = sign({sd: "fe"}, secret, {expiresIn: "7d"});

const payload = decode(token);
const payloadVer = verify(token, secret);

const delta = (payload as any).exp - Math.floor(Date.now() / 1000)
console.log(delta/3600/24)
console.log(payload, payloadVer, (payload as any).exp, Math.floor(Date.now() / 1000))