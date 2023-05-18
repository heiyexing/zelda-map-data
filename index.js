const fs = require("fs-extra");
const _ = require("lodash");
const path = require("path");

const mapList = ["ground","sky","underground"];
const categoryMap = {};

mapList.forEach(mapPath => {
    const categoryObj = require(`./data/${mapPath}/category.json`);
    const locationList = require(`./data/${mapPath}/location.json`);

    Object.values(categoryObj).forEach(item => {
        if (!categoryMap[item.title]) {
            item.id = item.title
            categoryMap[item.title] = _.pick(item, "title", "id", "icon")
        }

    })

    locationList.forEach(location => {
        const targetCategory = categoryMap[location.category.title];
        if (targetCategory) {
            if (!targetCategory.locations) {
                targetCategory.locations = [];
            }
            targetCategory.locations.push({
                ..._.pick(location, 'title' , 'description' , 'longitude' , 'latitude' , 'tags' , 'media'),
                mapType: mapPath
            })
        } else {
            throw new Error("未找到目标 Category")
        }
    })
})

// fs.writeFileSync("./result.json", JSON.stringify(categoryMap, null, 2))
fs.writeFileSync("./result.json", JSON.stringify(categoryMap))