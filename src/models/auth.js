const { promisify } = require('util')
const db = require('../db/knex')
const bcrypt = require('bcryptjs')

async function hash(password) {
    const hashed = await promisify(bcrypt.hash)(password, 8)
    return hashed
}

// Check if account already exists 
async function checkEmail(email) {
    const accountUser = await db('users')
        .where({
            email
        })
        .first()
        .catch(console.log)

    const accountOrg = await db('organizations')
        .where({
            email
        })
        .first()
        .catch(console.log)

    if (!accountUser && !accountOrg) {
        return false
    }
    return (accountUser.email === email || accountOrg.email === email) ? true : false
}

async function signupUser({ first_name, last_name, email, password, city, state, zip, avatar }) {
    const acctExist = await checkEmail(email)
    const hashed = await hash(password)

    if (acctExist === false) {
        const user = {
            first_name,
            last_name,
            email,
            password: hashed,
            city,
            state,
            zip: parseInt(zip),
            avatar
        }

        return db('users')
            .insert(user)
            .returning('*')
            .then(([response]) => {
                return response
            })
            .catch(console.log)
    } else {
        throw new Error("Bad Request. Failed to sign up")
    }
}

async function signupOrg({ email, password, name, aboutus, street_org, city_org, state_org, zip_org, logo, lat_org, long_org }) {
    const acctExist = await checkEmail(email)
    console.log("I am acctExist from checkEmail(email)", acctExist)
    const hashed = await hash(password)
    if (acctExist === false) {
        const org = {
            name,
            aboutus,
            email,
            password: hashed,
            street_org,
            city_org,
            state_org,
            zip_org: parseInt(zip_org),
            logo,
            lat_org: parseFloat(lat_org),
            long_org: parseFloat(long_org)
        }

        return db('organizations')
            .insert(org)
            .returning('*')
            .then(([response]) => response)
            .catch(console.log)
    } else {
        throw new Error("Bad Request. Failed to sign up")
    }
}

function login({ email, password }, tableName) {
    return db(tableName)
        .where({ email })
        .then(async ([account]) => {
            if (!account)
                throw new Error("Failed to log in")

            const isValid = await promisify(bcrypt.compare)(password, account.password) //hash the password that user puts in, compares with the hased in db
            if (!isValid)
                throw new Error("Either password or email does not match")
            return account
        }).catch(console.log)
}


module.exports = {
    signupUser,
    signupOrg,
    login
}