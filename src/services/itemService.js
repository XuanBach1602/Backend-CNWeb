const db = require("../models/index");
const { getAllBrand, createBrand } = require("./brandService");

/*
{
  name,
  description,
  seller_id,
  rate,
  number_of_rating
  item_specific: [
    {
      origin_id,
      name,
      price,
      number_sold
    }
  ]
}
*/

const itemImage = (id, imagePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const itemspec = await db.itemspecific.findAll({
        where: { origin_id: id },
      });

      await itemspec.forEach((item, index) => {
        item.img = imagePath[index];
        item.save();
      });
      const result = await db.itemspecific.findAll({
        where: { origin_id: id },
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

const createItemV2 = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const newItem = await db.items.create({
        name: data.name,
        description: data.description,
        seller_id: data.seller_id,
        rate: 0,
        number_of_rating: 0,
        number_sold: 0,
      });
      const seller = await db.sellers.findOne({
        where: { id: data.seller_id },
      });
      seller.number_of_products += 1;
      await seller.save();
      let listItemSpec = [];
      for (let itemspec of data.item_specific) {
        let itemSpecific = await db.itemspecific.create({
          origin_id: newItem.id,
          name: itemspec.name,
          price: itemspec.price,
        });
        listItemSpec.push(itemSpecific);
      }
      if (data.brand) {
        const brand = await getAllBrand();
        const brandName = brand.map((brandItem) => brandItem.name);
        const lowerCaseBrands = brandName.map((b) => b.toLowerCase());
        const lowerCaseDataBrand = data.brand.toLowerCase();
        console.log(lowerCaseBrands);
        if (lowerCaseBrands.includes(lowerCaseDataBrand)) {
          await db.branditem.create({
            item_id: newItem.id,
            brand_id: lowerCaseBrands.indexOf(lowerCaseDataBrand) + 1,
          });
        } else {
          const newBrand = await createBrand(lowerCaseDataBrand);
          await db.branditem.create({
            item_id: newItem.id,
            brand_id: newBrand.id,
          });
        }
      }
      if (data.tag && Array.isArray(data.tag)) {
        for (let tagId of data.tag) {
          await db.tagitem.create({
            item_id: newItem.id,
            tag_id: tagId,
          });
        }
      }
      let result = {
        newItem,
        listItemSpec,
      };
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

const createItem = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const newItem = await db.items.create({
        name: data.name,
        description: data.description,
        seller_id: data.seller_id,
        rate: 0,
        number_of_rating: 0,
      });
      const seller = await db.sellers.findOne({
        where: { id: data.seller_id },
      });
      seller.number_of_products = seller.number_of_products++;
      await seller.save();
      resolve(newItem);
    } catch (error) {
      reject(error);
    }
  });
};

const updateItem = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const item = await db.items.findOne({
        where: { id: data.id },
      });
      if (item) {
        if (data.name) item.name = data.name;
        if (data.description) item.description = data.description;
        await item.save();
        let updatedItem = await db.items.findOne({
          where: { id: data.id },
        });
        resolve(updatedItem);
      } else throw new Error("Item did not existed");
    } catch (error) {
      reject(error);
    }
  });
};

const deleteItem = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const deleteItem = await db.items.findOne({
        where: { id: id },
      });
      if (deleteItem) {
        await db.items.destroy({
          where: { id: id },
        });
        resolve("Deleted successfully");
      } else throw new Error("Item did not existed");
    } catch (error) {
      reject(error);
    }
  });
};

const getAllItem = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await db.items.findAll({
        raw: true,
      });

      // Fetch item-specific data for each item
      const itemsWithSpecific = await Promise.all(
        items.map(async (item) => {
          // Get the item-specific data
          const itemSpecific = await db.itemspecific.findOne({
            where: {
              origin_id: item.id,
            },
            raw: true,
          });

          // Merge the item-specific data (img and price) into the item object
          const itemWithSpecific = {
            ...item,
            img: itemSpecific.img,
            price: itemSpecific.price,
          };

          return itemWithSpecific;
        })
      );

      resolve(itemsWithSpecific);
    } catch (error) {
      reject(error);
    }
  });
};

const getItemBySellerId = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await db.items.findAll({
        where: {
          seller_id: id,
        },
        raw: true,
      });

      // Fetch item-specific data for each item
      const itemsWithSpecific = await Promise.all(
        items.map(async (item) => {
          // Get the item-specific data
          const itemSpecific = await db.itemspecific.findOne({
            where: {
              origin_id: item.id,
            },
            raw: true,
          });

          // Merge the item-specific data into the item object
          const itemWithSpecific = {
            ...item,
            img: itemSpecific.img,
            price: itemSpecific.price,
          };

          return itemWithSpecific;
        })
      );

      resolve(itemsWithSpecific);
    } catch (error) {
      reject(error);
    }
  });
};

const getItemById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let item = await db.items.findOne({
        where: { id: id },
        raw: true,
      });
      resolve(item);
    } catch (error) {
      reject(error);
    }
  });
};

const createItemSpecific = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let originItem = await db.items.findOne({
        where: { id: data.origin_id },
      });
      if (originItem) {
        const newItemSpecific = db.itemspecific.create({
          origin_id: data.origin_id,
          name: data.name,
          price: data.price,
        });
        resolve(newItemSpecific);
      } else throw new Error("Origin item did not existed");
    } catch (error) {
      reject(error);
    }
  });
};

const getItemSpecificByOriginId = (origin_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let items = "";
      items = await db.itemspecific.findAll({
        where: { origin_id: origin_id },
      });
      resolve(items);
    } catch (error) {
      reject(error);
    }
  });
};

const updateItemSpecific = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let item = "";
      item = await db.itemspecific.findOne({
        where: { id: data.id },
      });
      if (item) {
        if (data.name) item.name = data.name;
        if (data.price) item.price = data.price;
        await item.save();
        let updatedItem = await db.itemspecific.findOne({
          where: { id: data.id },
        });
        resolve(updatedItem);
      } else throw new Error("Item did not existed");
    } catch (error) {
      reject(error);
    }
  });
};

const deleteItemSpecific = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let item = await db.itemspecific.findOne({
        where: { id: id },
      });
      if (item) {
        await db.itemspecific.destroy({
          where: { id: id },
        });
        resolve("Delete successfully");
      } else throw new Error("Item did not exist");
    } catch (error) {
      reject(error);
    }
  });
};

const getItemByTagId = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await db.items.findAll({
        where: {
          tag_id: id,
        },
        raw: true,
      });

      // Fetch item-specific data for each item
      const itemsWithSpecific = await Promise.all(
        items.map(async (item) => {
          // Get the item-specific data
          const itemSpecific = await db.itemspecific.findOne({
            where: {
              origin_id: item.id,
            },
            raw: true,
          });

          // Merge the item-specific data into the item object
          const itemWithSpecific = {
            ...item,
            img: itemSpecific.img,
            price: itemSpecific.price,
          };

          return itemWithSpecific;
        })
      );

      resolve(itemsWithSpecific);
    } catch (error) {
      reject(error);
    }
  });
};

const getItemByBrandId = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let items = "";
      items = await db.branditem.findAll({
        where: { brand_id: id },
      });
      const itemId = items.map((item) => item.item_id);
      const itemList = [];

      for (let oneItemId of itemId) {
        const item = await db.items.findOne({
          where: { id: oneItemId },
        });
        itemList.push(item);
      }

      resolve(itemList);
    } catch (error) {
      reject(error);
    }
  });
};

const getItemInRange = (minPrice, maxPrice) => {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await db.items.findAll({
        raw: true,
      });

      // Fetch item-specific data for each item
      const itemsWithSpecific = await Promise.all(
        items.map(async (item) => {
          // Get the item-specific data
          const itemSpecific = await db.itemspecific.findOne({
            where: {
              origin_id: item.id,
            },
            raw: true,
          });

          // Merge the item-specific data (img and price) into the item object
          const itemWithSpecific = {
            ...item,
            img: itemSpecific.img,
            price: itemSpecific.price,
          };

          return itemWithSpecific;
        })
      );

      // Filter items based on price range
      const filteredItems = itemsWithSpecific.filter((item) => {
        if (minPrice && item.price < minPrice) {
          return false; // Item's price is below the minimum price
        }
        if (maxPrice && item.price > maxPrice) {
          return false; // Item's price is above the maximum price
        }
        return true; // Item's price is within the specified range
      });

      resolve(filteredItems);
    } catch (error) {
      reject(error);
    }
  });
};

const getItemFilter = (filterData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const items = await db.items.findAll({
        raw: true,
      });

      // Fetch item-specific data for each item
      const itemsWithSpecific = await Promise.all(
        items.map(async (item) => {
          // Get the item-specific data
          const itemSpecific = await db.itemspecific.findOne({
            where: {
              origin_id: item.id,
            },
            raw: true,
          });

          // Fetch the brand IDs for the item from the branditem table
          const brandItems = await db.branditem.findAll({
            where: {
              item_id: item.id,
            },
            raw: true,
          });

          // Extract the brand IDs from brandItems
          const brandIds = brandItems.map((brandItem) => brandItem.brand_id);

          // Merge the item-specific data (img, price, and brand_id) into the item object
          const itemWithSpecific = {
            ...item,
            img: itemSpecific.img,
            price: itemSpecific.price,
            brand_id: brandIds,
          };

          return itemWithSpecific;
        })
      );

      // Filter items based on provided data
      const filteredItems = itemsWithSpecific.filter((item) => {
        if (
          filterData.brand_id &&
          !item.brand_id.includes(filterData.brand_id)
        ) {
          return false; // Item's brand does not match the provided brand
        }
        if (filterData.id && item.id !== filterData.id) {
          return false; // Item's ID does not match the provided ID
        }
        if (filterData.seller_id && item.seller_id !== filterData.seller_id) {
          return false; // Item's seller ID does not match the provided seller ID
        }
        if (filterData.minPrice && item.price < filterData.minPrice) {
          return false; // Item's price is below the minimum price
        }
        if (filterData.maxPrice && item.price > filterData.maxPrice) {
          return false; // Item's price is above the maximum price
        }
        if (
          filterData.category_id &&
          item.category_id !== filterData.category_id
        ) {
          return false; // Item's category does not match the provided category
        }
        return true; // Item matches all provided filters
      });

      resolve(filteredItems);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getAllItem,
  getItemBySellerId,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  createItemSpecific,
  getItemSpecificByOriginId,
  updateItemSpecific,
  deleteItemSpecific,
  createItemV2,
  itemImage,
  getItemByTagId,
  getItemByBrandId,
  getItemInRange,
  getItemFilter,
};
