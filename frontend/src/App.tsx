import React, { useState, useEffect } from 'react';
import { Employee } from './types/Employee';
import { employeeService } from './services/api';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import './App.css';

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      setError('Failed to fetch employees. Make sure the backend server is running.');
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await employeeService.create(employeeData);
      setShowForm(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create employee');
    }
  };

  const handleUpdate = async (id: number, employeeData: Partial<Employee>) => {
    try {
      await employeeService.update(id, employeeData);
      setShowForm(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }
    try {
      await employeeService.delete(id);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleFormSubmit = (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingEmployee && editingEmployee.id) {
      handleUpdate(editingEmployee.id, employeeData);
    } else {
      handleCreate(employeeData);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Employee Management System</h1>
        <button className="btn-add" onClick={() => setShowForm(true)}>
          Add New Employee
        </button>
      </header>

      <main className="app-main">
        {loading && <div className="loading">Loading employees...</div>}
        {error && <div className="error">{error}</div>}
        {!loading && !error && (
          <EmployeeList
            employees={employees}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default App;

