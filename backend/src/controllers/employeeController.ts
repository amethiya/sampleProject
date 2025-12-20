import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Employee } from '../models/Employee';

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows]: any = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, position, department, salary } = req.body;
    
    if (!name || !email || !position || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [result]: any = await pool.query(
      'INSERT INTO employees (name, email, position, department, salary) VALUES (?, ?, ?, ?, ?)',
      [name, email, position, department, salary || null]
    );
    
    // Fetch the newly created employee
    const [rows]: any = await pool.query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    
    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, position, department, salary } = req.body;
    
    const [result]: any = await pool.query(
      'UPDATE employees SET name = ?, email = ?, position = ?, department = ?, salary = ? WHERE id = ?',
      [name, email, position, department, salary || null, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Fetch the updated employee
    const [rows]: any = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Fetch the employee before deleting
    const [rows]: any = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    
    res.json({ message: 'Employee deleted successfully', employee: rows[0] });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

