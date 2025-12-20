import { Request, Response } from 'express';
import { pool } from '../config/database';
import { Employee } from '../models/Employee';

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
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
    
    const result = await pool.query(
      'INSERT INTO employees (name, email, position, department, salary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, position, department, salary || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, position, department, salary } = req.body;
    
    const result = await pool.query(
      'UPDATE employees SET name = $1, email = $2, position = $3, department = $4, salary = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, email, position, department, salary || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ message: 'Employee deleted successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

