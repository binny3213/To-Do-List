//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema ={
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
    name:"Welcome to your todolist!"
});

const item2 = new Item ({
    name:"Hit the + button to add a new item."
});

const item3 = new Item ({
    name:"<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req,res){
 
    Item.find({}).then(foundItems => {
        if(foundItems.length === 0){
            Item.insertMany([
                defaultItems
            ]).then(function(){
                    console.log("Data successfully inserted to DB!")
                }).catch(function(err){
                    console.log(err);
            });
            res.redirect("/");// go back to root route after having items this
            // time and then it will get to else and render it to the page
        }
        else{
            res.render("list",{listTitle: "Today", newListItems:foundItems});
        }
    })
    .catch(err => {console.error('there was an error', err)});

});

app.get("/:customListName", function(req,res){
    //making first letter in the string capitalize and rest small
    const customListName = _.capitalize(req.params.customListName);

    async function findList() {
        try {
          const foundList = await List.findOne({ name: customListName }).exec();
          if (!foundList) {
            const list = new List ({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
          } 
          else {
            res.render("list",{listTitle: foundList.name, newListItems:foundList.items});
          }
        } catch (err) {
          console.error("Error:", err);
        }
      }
      
      // Call the async function
      findList();

});

app.post("/", function(req,res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else
    {
        List.findOne({ name: listName })
        .exec()
        .then((foundList) => {
        if (foundList) {
            foundList.items.push(item);
            return foundList.save();
         } else {
            console.log("List not found");
            return null; // Return null or another value to indicate no list found
         }
     })
      .then(() => {
       res.redirect("/" + listName);
     })
       .catch((error) => {
       console.error(error);
     });

    }

  
 
});

app.post("/delete", function(req,res){

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId.trim())
        .then(deletedItem => {
          if (deletedItem) {
            // Item was successfully deleted
            console.log("item has been deleted from the list!");
            res.redirect("/");
          } else {
            // Item with the specified ID was not found
            console.log("Id wasnt found at the list");
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
    else
    {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId.trim() } } }
          )
            .then(() => {
              res.redirect("/" + listName);
            })
            .catch((error) => {
              console.error(error);
            });
    }

  
      
});


app.post("/Work", function(req,res){
    const item = req.body.newItem;
    workItems.push(item);
    res.redirect("/Work");
});

app.get("/about", function(req,res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});