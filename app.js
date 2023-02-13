const express = require('express');
const mongoose = require('mongoose');
const Deposit = require('./models/deposits');
const AdminData = require('./models/adminData');
const nodeCron = require('node-cron');
const Member = require('./models/member');
const Earning = require('./models/earnings');
const Withdrawal = require('./models/withdrawals');
const ClubData = require('./models/clubData');
const Contribution = require('./models/contributions');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser , checkAdmin} = require('./middleware/authMiddleware');
const ejs = require('ejs');
const sendMail = require('./controllers/email');
const { response } = require('express');

//express app
const app = express();

//connect to mongoDB
const dbURI = 'mongodb+srv://blaise1:blaise119976@cluster0.nmt34.mongodb.net/GrowthSpring?retryWrites=true&w=majority';
mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then((result) => app.listen(800));

//register view engine
app.set('view engine', 'ejs');

//middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//check user
app.use(checkUser);

//authroutes
app.use(authRoutes);

//EVERYDAY
const payDayCheck = nodeCron.schedule("1 1 1 * * *", ()=> {
    //reduce days-left for each investments, if it is zero, remove it from list
    ClubData.findOne().then(result => {
        if(result.pending != null){           
           result.pending.forEach(entry => {
            const daysLeft = entry.daysLeft - 1;            
            ClubData.updateOne({}, {$set: {"pending.$[elem].daysLeft": daysLeft}}, {arrayFilters: [{"elem.businessName" : entry.businessName}]}).then();
            if(daysLeft < 0){
                ClubData.updateOne({}, {$pull: {"pending": {businessName: entry.businessName}}}).then();
                ClubData.updateOne({}, {$set: {"investments.$[elem].status": "contributions-done"}}, {arrayFilters: [{"elem.businessName" : entry.businessName}]}).then();                                
            }
           })
        }
    });    

});

//update club data with new signups

//home
app.get('/home', requireAuth, checkAdmin, function (req, res) {
  res.render('home');
});

//login
app.get('/', requireAuth, checkAdmin, function (req, res) {
    res.render('login');
  });

//admin
app.get('/adminGr', requireAuth, checkAdmin, (req,res)=>{
  if (res.locals.admin) res.render("adminGr");
  else res.redirect("/home");
} );


//fetch user data
app.get('/userdataG', (req, res) => {
Member.findOne({name: req.user.name}).then(resp => {
    Earning.findOne({name: req.user.name}).then(response => {
    res.json({worth: resp.totalWorth, uninvested: resp.uninvestedCash, with: response.availableForWithdraw, current: resp.currentInvestments});
        });
    })
});

//fetch club data
app.get('/clubdataG', (req, res) => {
        ClubData.findOne().then(response => {
        res.json({worth: response.totalWorth, members: response.totalMembers});
            });
        
    });

//fetch opportunites
app.get('/opportunitiesListG', (req, res) => {
        ClubData.findOne().then(response => {
        res.json({list: response.pending});
            });    
    });
 
//fetch investments
app.get('/investmentsListG', (req, res) => {
    Contribution.findOne({name: req.user.name}).then(response => {
    res.json({list: response.contributions});
        });    
});    

//deposit history
app.get('/deposit-history', (req, res) => {
    Deposit.find({name: req.user.name, status: "verified"}).sort({date:-1}).then(response => {
    res.json({list: response});
    });    
});

//returns history
app.get('/returns-history', (req, res) => {
    Earning.findOne({name: req.user.name}).then(response => {
        const sortedList = response.list.sort((a, b) => Number(b.date) - Number(a.date),);  
        res.json({list: sortedList});
    });    
});

//club investments history
app.get('/club-investments-history', (req, res) => {
    ClubData.findOne().then(response => {
        const sortedList = response.investments.sort((a, b) => Number(b.date) - Number(a.date),);  
        res.json({list: sortedList});
    });    
});

//withdrawal history
app.get('/withdrawal-history', (req, res) => {
    Withdrawal.find({name: req.user.name, status: "sent"}).sort({date:-1}).then(response => {
    res.json({list: response});
    });    
});

//deposits
app.post('/depositG', (req, res) => {
    if(req.body.transID != ""){
const today = new Date();    
Deposit.create({name: req.user.name, date: today, transID: req.body.transID, status: "unverified", method: req.body.sendUsing, amount: 0}).then();
    }
});

//check for charges
app.post('/chargesG', (req, res) => {
    AdminData.findOne().then( result => {
        var stop = 0;
        var charge = 0;
        result.MMCharges.forEach(entry => {
            if(entry.limit >= req.body.withdrawAmount && stop == 0){
                charge = entry.charge;
                stop = 1;
            }
        })
        res.json({charge: charge});
    });
});

//withdrawals
app.post('/withdrawG', (req, res) => {
    Earning.findOne({name: req.user.name}).then( result => {
        const Charge = parseInt(req.body.Charge);
        const Amount = parseInt(req.body.Amount);
        if(result.availableForWithdraw >= (Amount + Charge) && Amount != 0){
            const today = new Date();  
            const availableForWithdraw = result.availableForWithdraw - (Amount + Charge);  
            Withdrawal.create({name: req.user.name, date: today, amount: Amount, charge: Charge, status: "not-sent", transID: "", method: req.body.withdrawUsing}).then(); 
            Earning.updateOne({name: req.user.name}, {$set: {availableForWithdraw: availableForWithdraw}}).then();
            Member.findOne({name: result.name}).then(data => {
                const totalWorth = data.totalWorth - (Amount + Charge);
                Member.updateOne({name: result.name}, {$set: {"totalWorth": totalWorth}}).then();
            }); 
            ClubData.findOne().then(data => {
                const totalWorth = data.totalWorth - (Amount + Charge);
                ClubData.updateOne({}, {$set: {"totalWorth": totalWorth}}).then();
            });                  
        }
    });
      //Send  email
      const emailRecipient = ["blaisemwebe@gmail.com", "philemonariko@gmail.com", "andykawums@gmail.com"];
      const emailSubject = "Withdrawal Request";
      let emailFile = ""
      emailFile = "./views/email_views/withdrawalRequest.html";
      emailRecipient.forEach(recipient => {
      ejs.renderFile(emailFile, function (err, data) {
        if (err){
          console.log(err);
        } else {
          sendMail(recipient, emailSubject, data);          
        }
      });
    });
});

//submit investment
app.post('/submit-investment', (req, res) => {
    Member.findOne({name: req.user.name}).then(result => {
        if(result.uninvestedCash >= req.body.Amount && req.body.Amount > 5000){
            const uninvestedCash = result.uninvestedCash - req.body.Amount;
            const currentInvestments = result.currentInvestments + 1;
            ClubData.findOne().then(results => {
                var amountLeft = 0;
                var amountCollected = 0;
                results.investments.forEach(investment => {
                    if (investment.businessName == req.body.businessName){
                        amountCollected = investment.amountCollected + parseInt(req.body.Amount);
                        amountLeft = investment.amountLeft - parseInt(req.body.Amount);
                        set = 1;
                        ClubData.updateOne({}, {$set: {"investments.$[elem].amountLeft": amountLeft, "investments.$[elem].amountCollected": amountCollected}}, {arrayFilters: [{"elem.businessName" : req.body.businessName}]}).then();
                    }
                    });
                Contribution.findOne({name: req.user.name}).then(response => {
                    var set = 0;
                    var myContribution = parseInt(req.body.Amount);
                    response.contributions.forEach(business => {
                        if (business.businessName == req.body.businessName){
                            myContribution = business.amount + parseInt(req.body.Amount);
                            set = 1;
                            Contribution.updateOne({name: req.user.name}, {$set: {"contributions.$[elem].amount": myContribution, "principleLeft": myContribution}}, {arrayFilters: [{"elem.businessName" : req.body.businessName}]}).then();
                        }
                    });
                    if (set == 0){
                        Contribution.updateOne({name: req.user.name}, {$push: {"contributions" : {"businessName": req.body.businessName, "amount": myContribution, "principleLeft": myContribution, "profit": 0 , "status": "preparation"}}}).then();
                        }
                    });
                });
            Member.updateOne({name: req.user.name}, {$set: {"uninvestedCash": uninvestedCash, "currentInvestments": currentInvestments}}).then();
            }
        });
    });


//ADMIN SYSTEM
//get deposit data
app.get('/depositListG', (req, res) => {
    Deposit.find({status: 'unverified'}).then(result => {
        if (result != null) {
        res.json({list: result}); }
    });
});


//get withdrawals data
app.get('/withdrawalsListG', (req, res) => {
    Withdrawal.find({status: 'not-sent'}).then(result => {
        if (result != null) {
        res.json({list: result}); }
    });
});

//get pending investments data
app.get('/pending-investmentsList', (req, res) => {
    ClubData.findOne().then(result => {
        res.json({list: result.investments}); 
    });
}); 

//get current investments data
app.get('/current-investmentsList', (req, res) => {
    ClubData.findOne().then(result => {
        res.json({list: result.investments}); 
    });
}); 

//checking for suspisious activity
//sending data everyday via email to check for suspicious activity in excel

//approve deposit
app.post('/approve-depositG', (req, res) => {
    if(req.body.amount != ""){
        Deposit.findOne({transID: req.body.transID, status: {$ne: "verified"}}).then(responce => {
            Deposit.updateOne({transID: responce.transID}, {$set: {status: "verified", "amount": req.body.amount}}).then(result => {
                Member.findOne({name: responce.name}).then(results => {
                const totalWorth = results.totalWorth + parseInt(req.body.amount);
                const uninvestedCash = results.uninvestedCash + parseInt(req.body.amount);
                Member.updateOne({name: results.name}, {$set: {totalWorth: totalWorth, uninvestedCash: uninvestedCash}}).then(); });
                ClubData.findOne().then(data => {
                    const totalWorth = data.totalWorth + parseInt(req.body.amount);
                    ClubData.updateOne({}, {$set: {"totalWorth": totalWorth}}).then();
                });
            });
        }); 
    }
   
   
});

//reject deposit
app.post('/reject-depositG', (req, res) => {
   Deposit.updateOne({transID: req.body.transID}, {$set: {status: "rejected"}}).then();   
});

//add to new Investment
app.post('/new-investment', (req, res) => {
    const today = new Date();
    const amountLeft = parseInt(req.body.requiredAmount) * parseInt(req.body.interestedPeople);
    ClubData.updateOne({}, {$push: {"investments": {"date": today, "businessName": req.body.businessName, "amountCollected": 0, "amountLeft": amountLeft, "status": "contributions", "description": req.body.description}}}).then();
    ClubData.updateOne({}, {$push: {"pending": {"businessName": req.body.businessName, "requiredContribution": req.body.requiredAmount, "daysLeft": req.body.remainingDays, "description": req.body.description}}}).then();           

});

//finalise investment
app.post('/finalise-investment', (req, res) => {
    ClubData.updateOne({}, {$set: {"investments.$[elem].status": "On-going"}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then();
    ClubData.updateOne({}, {$pull: {"pending": {"businessName": req.body.name}}}).then();
    Contribution.find().then(results => {
        results.forEach(result => {
            result.contributions.forEach(contribution => {
                if(contribution.businessName == req.body.name){
                    Contribution.updateOne({name: result.name}, {$set: {"contributions.$[elem].status": "On-going"}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then();
                }  
            });  
        });  
    });       
});

//reject pending investment
app.post('/reject-investment', (req, res) => {
    ClubData.updateOne({}, {$set: {"investments.$[elem].status": "rejected"}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then(); 
    ClubData.updateOne({}, {$pull: {"pending": {"businessName": req.body.name}}}).then();  
    Contribution.find().then(results => {
        results.forEach(result => {
            result.contributions.forEach(contribution => {
                if(contribution.businessName == req.body.name){
                    Member.findOne({name: result.name}).then(data => {
                        const uninvestedCash = data.uninvestedCash + contribution.amount;
                        const currentInvestments = result.currentInvestments - 1;
                        Member.updateOne({name: result.name}, {$set: {"uninvestedCash": uninvestedCash, "currentInvestments": currentInvestments}}).then();
                    });                    
                }            
        });
    });    
});

});

//submit returns
app.post('/submit-returns', (req, res) => {
    Contribution.find().then(results => {
        results.forEach(result => {
            var myReturn = 0;
            const today = new Date();
            result.contributions.forEach(contribution => {
                if(contribution.businessName == req.body.name){
                    myReturn = Math.round((contribution.amount * parseInt(req.body.amount))/parseInt(req.body.collected));                                        
                    if (contribution.principleLeft == 0 || contribution.principleLeft < myReturn){
                        var earnings = myReturn - contribution.principleLeft;
                        var profit = contribution.profit + earnings;
                        Earning.findOne({name: result.name}).then(response => {
                            const availableForWithdraw = Math.round(response.availableForWithdraw + earnings);
                            const remainder = contribution.principleLeft;
                            Earning.updateOne({name : result.name}, {$set: {availableForWithdraw: availableForWithdraw}}).then();
                            Contribution.updateOne({name : result.name}, {$set: {"contributions.$[elem].principleLeft": 0, "contributions.$[elem].profit": profit}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then();
                            Member.findOne({name: result.name}).then(data => {
                                const uninvestedCash = data.uninvestedCash + remainder;
                                const totalWorth = data.totalWorth + earnings;
                                Member.updateOne({name: result.name}, {$set: {"totalWorth": totalWorth, "uninvestedCash": uninvestedCash}}).then();
                            });
                            ClubData.findOne().then(data => {
                                const totalWorth = data.totalWorth + earnings;
                                ClubData.updateOne({}, {$set: {"totalWorth": totalWorth}}).then();
                            });
                        });
                    }else{
                        var principleLeft = Math.round(contribution.principleLeft - myReturn);
                        Contribution.updateOne({name : result.name}, {$set: {"contributions.$[elem].principleLeft": principleLeft}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then();
                        Member.findOne({name: result.name}).then(data => {
                            const uninvestedCash = data.uninvestedCash + myReturn;
                            Member.updateOne({name: result.name}, {$set: {"uninvestedCash": uninvestedCash}}).then();
                        });
                    }
                    Earning.updateOne({name : result.name}, {$push: {"list": {"date": today, "source": req.body.name, "amount": myReturn}}}).then();
                }
            });
        });
    });
});


//approve withdrawal
app.post('/approve-withdrawalG', (req, res) => {
if(req.body.transID != ""){
    Withdrawal.findOne({_id: req.body.id, status: {$ne: "sent"}}).then(responce => {
        Withdrawal.updateOne({_id: responce._id}, {$set: {transID: req.body.transID, status: "sent"}}).then();
        });
    }    
});

//end project
app.post('/end-project', (req, res) => {
    Contribution.find().then(results => {
        results.forEach(result => {
            var myLoss = 0;
            const today = new Date();
            result.contributions.forEach(contribution => {
                if(contribution.businessName == req.body.name){
                    myLoss = contribution.principleLeft * -1;
                    var profit = contribution.profit + myLoss;
                    Member.findOne({name: result.name}).then(data => {
                        const totalWorth = data.totalWorth + myLoss;
                        const currentInvestments = result.currentInvestments - 1;
                        Member.updateOne({name: result.name}, {$set: {"totalWorth": totalWorth, "currentInvestments": currentInvestments}}).then();
                        Contribution.updateOne({name: result.name}, {$set: {"contributions.$[elem].status": "Done", "contributions.$[elem].profit": profit}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then(); 
                        ClubData.findOne().then(dataC => {
                            const clubWorth = dataC.totalWorth + myLoss;
                            ClubData.updateOne({}, {$set: {"totalWorth": clubWorth}}).then();
                        });
        
                    });                                       
                }
            });

        });
    ClubData.updateOne({}, {$set: {"investments.$[elem].status": "done"}}, {arrayFilters: [{"elem.businessName" : req.body.name}]}).then(); 
    });           
});




