import React, { useState, useEffect } from 'react';
import { Employee } from '../types/Employee';
import './EmployeeForm.css';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary?.toString() || '',
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      email: formData.email,
      position: formData.position,
      department: formData.department,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
    });
  };

  return (
    <div className="form-overlay">
      <div className="form-container">
        <h2>{employee ? 'Edit Employee' : 'Add New Employee'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="position">Position *</label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="department">Department *</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="salary">Salary</label>
            <input
              type="number"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {employee ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;

