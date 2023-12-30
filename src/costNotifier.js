import axios from 'axios';
import querystring from 'querystring';
import moment from 'moment'
import AWS from 'aws-sdk'

async function getAWSCost() {
    const now = moment()
    const start = now.format('YYYY-MM-01')
    const end = now.add(1, 'months').format('YYYY-MM-01')
    
    const costExplorer = new AWS.CostExplorer({ region: 'us-east-1' })
    const params = {
        TimePeriod: {
            Start: start,
            End: end
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost']
    }
    const costAndUsage = await costExplorer.getCostAndUsage(params).promise()
    const usdCost = costAndUsage.ResultsByTime[0].Total.UnblendedCost.Amount
    
    return usdCost
}

async function notifyCostToLine(usdCost) {
    const URL = 'https://notify-api.line.me/api/notify'
    const TOKEN = process.env.LINE_NOTIFY_TOKEN
    const data = {
        message: `今月のAWS使用料 : $${usdCost}`
    }
    const headers = {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    return await axios.post(
        URL, 
        querystring.stringify(data), 
        { headers: headers }
    )
}

export async function handler(event, context) {
    const usdCost = await getAWSCost()
    await notifyCostToLine(usdCost)
    
    return {
        message: '通知に成功しました。'
    }
}