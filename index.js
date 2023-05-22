const fs = require("fs-extra");
const _ = require("lodash");
const MapHelper = require("./MapHelper");
const path = require("path");
const { fromPairs } = require("lodash");

const mapTypeList = ["ground", "sky", "underground"];

const mapTypeNameMap = {
  ground: "地面",
  sky: "天空",
  underground: "底下",
};

const data = [];

mapTypeList.forEach((mapPath) => {
  const groupList = require(`./data/${mapPath}/group.json`);
  const locationList = require(`./data/${mapPath}/location.json`);

  const groupMap = fromPairs(
    groupList
      .map((group, groupIndex) =>
        group.categories.map((category) => [
          category.title,
          {
            group: group.title,
            groupOrder: groupIndex,
          },
        ])
      )
      .flat()
  );

  locationList.forEach((location) => {
    const targetCategory = {
      category: location.category.title,
      icon: location.category.icon,
    };
    const targetGroup = groupMap[location.category.title];
    if (targetCategory && targetGroup) {
      data.push({
        ..._.pick(
          location,
          "title",
          "description",
          "longitude",
          "latitude",
          "tags",
          "media"
        ),
        mapType: mapPath,
        mapTypeName: mapTypeNameMap[mapPath],
        ...(targetCategory ?? {}),
        ...(targetGroup ?? {}),
      });
    } else {
      console.warn("未找到目标 Category 或 Group");
    }
  });
});

const mapHelper = new MapHelper(256, "google");

const zoom = 15;

// 左上角坐标
const imagetl = [-1.1355909376832187, 1.0634368616709793];
// 右下角
const imagebr = [-0.2693123023346118, 0.3418390811014973];

// 平面坐标
const tlpx = mapHelper.lngLatToPixels(imagetl[0], imagetl[1], zoom);
const brpx = mapHelper.lngLatToPixels(imagebr[0], imagebr[1], zoom);

// 长宽
const w = brpx[0] - tlpx[0];
const h = brpx[1] - tlpx[1];

// 地图左上角的 meter
const leftTopMeters = mapHelper.lngLatToPixels(-180, 85.051355, zoom);
// 地图右上角的 meter
const rightBottomMeters = mapHelper.lngLatToPixels(
  17.75066182074289,
  15.04206005516698,
  zoom
);

const w1 = leftTopMeters[0] - rightBottomMeters[0];
const h1 = leftTopMeters[1] - rightBottomMeters[1];

data.forEach((item) => {
  // 待转坐标
  const ll = [item.longitude, item.latitude];

  // 待转坐标 - 平面坐标
  const px = mapHelper.lngLatToPixels(ll[0], ll[1], zoom);

  const position = [
    ((px[0] - tlpx[0]) / w) * 36000,
    ((px[1] - tlpx[1]) / h) * 30000,
  ];

  const [lon, lat] = mapHelper.pixelsTolngLat(
    leftTopMeters[0] - (position[0] / 36000) * w1,
    leftTopMeters[1] - (position[1] / 30000) * h1,
    zoom
  );
  item.longitude = lon;
  item.latitude = lat;

  if (item.icon === "yahaha2_start") {
    item.icon = "yahaha2";
  }
  if (item.icon === "goddess") {
    item.icon = "mini_challenge";
  }
  if (item.title === "运输呀哈哈（起点）") {
    item.title = "运输呀哈哈(起点)";
  }
});

fs.writeFileSync("./result.json", JSON.stringify(data, null, 2));
