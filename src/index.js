const { default: axios } = require('axios');
const cacheManager = require('cache-manager');
const redisStore = require('cache-manager-ioredis');
const express = require("express")
const app = express();

const redisCache = cacheManager.caching({
  store: redisStore,
  host: 'localhost', 
  port: 6379
});

const getCep = async (cep) => {
    cep = cep.replace(/[^0-9]/, "");
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`)
    return response.data
}

const productsByCompany = {
    "51129e88-6608-42c2-b769-01cb33d40443": [
        {
            name: "Smart phone galaxy",
            price: 100
        }, 
        {
            name: "Smart TV Samsung",
            price: 3000
        }
    ],
    "94e0fad5-a080-40eb-814c-65853c632685": [
        {
            name: "Iphone 11",
            price: 8000
        }, 
        {
            name: "Iphone 13",
            price: 15000
        }
    ]
}

app.get("/products", async (request, response) => {
    const companyId = request.query.companyId;
    // const result = await redisCache.get("products")
    const result = await redisCache.get(`products:${companyId}`)
    if (result) {
        console.log("CACHED")
        return response.json(result)
    }

    const data = productsByCompany[companyId]
    // await redisCache.set("products", data, { ttl: 60 })
    await redisCache.set(`products:${companyId}`, data, { ttl: 60 })
    response.json(productsByCompany[companyId])
})

app.get("/search/:cep", async (request, response) => {
    const result = await redisCache.get(request.params.cep)
    if (result) {
        return response.json(result)
    }

    const data = await getCep(request.params.cep);
    await redisCache.set(request.params.cep, data, { ttl: 60 })
    response.json(data)
})

app.listen(8000, () => console.log("Server is running"))