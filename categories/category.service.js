const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const Category = db.Category;

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await Category.find().select('-hash');
}

async function getById(id) {
    return await Category.findById(id).select('-hash');
}

async function create(categoryParam) {
    // validate
    if (await Category.findOne({ name: categoryParam.name })) {
        throw 'Category "' + categoryParam.name + '" is already taken';
    }

    const category = new Category(categoryParam);
    oldDefault = new Category();
    // save category
    if (categoryParam.is_default == true)
    {
      oldDefault = await Category.findOne({ is_default: true });
    }
    await category.save();
    if (categoryParam.is_default == true)
    {
      await Category.update({"_id" : oldDefault.id }, {is_default: false})
    }    
}

async function update(id, categoryParam) {
    const category = await Category.findById(id);
    const oldDefault = await Category.findOne({ is_default: true });
    // validate
    if (!category) throw 'Category not found';
    if (category.name !== categoryParam.name && await Category.findOne({ name: categoryParam.name })) {
        throw 'Category "' + categoryParam.name + '" is already taken';
    }

    if (category.is_default == true) {
      categoryParam.is_default = true
    }

    // copy categoryParam properties to category
    Object.assign(category, categoryParam);

    await category.save();
    if (categoryParam.is_default == true && category.id != oldDefault.id)
    {
      await Category.update({"_id" : oldDefault.id }, {is_default: false})
    }
}

async function _delete(id) {
    const category = await Category.findById(id);
    if (category.is_default == true) {
        throw 'Default category cannot be deleted';
    } else {
      await Category.findByIdAndRemove(id);
    }
}
