import { connectDBDigitalLibrary } from '../config/dbConnection.js';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const query = 'SELECT * FROM Categories ORDER BY category_name';
    const result = await connectDBDigitalLibrary(query);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { category_name, color } = req.body;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if category already exists
    const checkQuery = `SELECT category_id FROM Categories WHERE category_name = '${category_name}'`;
    const existingCategory = await connectDBDigitalLibrary(checkQuery);

    if (existingCategory.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Category already exists'
      });
    }

    // Create new category
    const insertQuery = `INSERT INTO Categories (category_name, color) VALUES ('${category_name}', '${color || '#3B82F6'}')`;
    await connectDBDigitalLibrary(insertQuery);

    res.json({
      success: true,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, color } = req.body;

    if (!category_name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if category exists
    const checkQuery = `SELECT category_id FROM Categories WHERE category_id = ${id}`;
    const existingCategory = await connectDBDigitalLibrary(checkQuery);

    if (existingCategory.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Update category
    const updateQuery = `UPDATE Categories SET category_name = '${category_name}', color = '${color || '#3B82F6'}' WHERE category_id = ${id}`;
    await connectDBDigitalLibrary(updateQuery);

    res.json({
      success: true,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is being used by books
    const checkUsageQuery = `SELECT COUNT(*) as count FROM Books WHERE category_id = ${id}`;
    const booksUsingCategory = await connectDBDigitalLibrary(checkUsageQuery);

    if (booksUsingCategory.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category that is being used by books'
      });
    }

    // Check if category exists and delete it
    const deleteQuery = `DELETE FROM Categories WHERE category_id = ${id}`;
    const result = await connectDBDigitalLibrary(deleteQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};