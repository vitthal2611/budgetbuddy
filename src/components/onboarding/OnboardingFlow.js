import React, { useState } from 'react';
import './OnboardingFlow.css';
import { useData } from '../../contexts/DataContext';

const OnboardingFlow = ({ onComplete }) => {
  const { addEnvelope, addPaymentMethod } = useData();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    envelopes: [],
    paymentMethods: [],
    firstIncome: null
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to BudgetBuddy! 👋',
      subtitle: 'Your journey to financial freedom starts here',
      component: WelcomeStep
    },
    {
      id: 'envelopes',
      title: 'Create Your Envelopes 📦',
      subtitle: 'Organize your spending into categories',
      component: EnvelopesStep
    },
    {
      id: 'payment-methods',
      title: 'Add Payment Methods 💳',
      subtitle: 'Track where your money comes from and goes',
      component: PaymentMethodsStep
    },
    {
      id: 'income',
      title: 'Log Your First Income 💰',
      subtitle: 'Start tracking your money',
      component: IncomeStep
    },
    {
      id: 'complete',
      title: 'You\'re All Set! 🎉',
      subtitle: 'Ready to take control of your finances',
      component: CompleteStep
    }
  ];

  const handleNext = (data) => {
    setUserData({ ...userData, ...data });
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (window.confirm('Skip onboarding? You can always set things up later in Settings.')) {
      onComplete();
    }
  };

  const handleComplete = () => {
    // Save all data
    userData.envelopes.forEach(env => {
      try {
        addEnvelope(env.name, env.category);
      } catch (error) {
        console.error('Error adding envelope:', error);
      }
    });

    userData.paymentMethods.forEach(method => {
      try {
        addPaymentMethod(method);
      } catch (error) {
        console.error('Error adding payment method:', error);
      }
    });

    // Mark onboarding as complete
    localStorage.setItem('onboardingComplete', 'true');
    onComplete();
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-progress">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          <button className="btn-skip" onClick={handleSkip}>
            Skip
          </button>
        </div>

        <div className="onboarding-content">
          <h1 className="onboarding-title">{steps[currentStep].title}</h1>
          <p className="onboarding-subtitle">{steps[currentStep].subtitle}</p>

          <CurrentStepComponent
            userData={userData}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentStep === 0}
            isLast={currentStep === steps.length - 1}
          />
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep = ({ onNext, isFirst }) => {
  return (
    <div className="step-content">
      <div className="welcome-illustration">
        <div className="illustration-icon">💰</div>
      </div>
      
      <div className="welcome-text">
        <h3>What is Zero-Based Budgeting?</h3>
        <p>Give every rupee a job before you spend it. With envelope budgeting, you'll:</p>
        <ul className="benefits-list">
          <li>✓ Know exactly where your money goes</li>
          <li>✓ Stop overspending before it happens</li>
          <li>✓ Save for goals that matter to you</li>
          <li>✓ Feel in control of your finances</li>
        </ul>
      </div>

      <div className="step-actions">
        <button className="btn-primary" onClick={() => onNext({})}>
          Let's Get Started →
        </button>
      </div>
    </div>
  );
};

const EnvelopesStep = ({ userData, onNext, onBack }) => {
  const [envelopes, setEnvelopes] = useState(userData.envelopes || [
    { name: 'Groceries', category: 'need' },
    { name: 'Rent', category: 'need' },
    { name: 'Entertainment', category: 'want' }
  ]);
  const [newEnvelope, setNewEnvelope] = useState('');
  const [newCategory, setNewCategory] = useState('need');

  const handleAdd = () => {
    if (newEnvelope.trim()) {
      setEnvelopes([...envelopes, { name: newEnvelope.trim(), category: newCategory }]);
      setNewEnvelope('');
    }
  };

  const handleRemove = (index) => {
    setEnvelopes(envelopes.filter((_, i) => i !== index));
  };

  return (
    <div className="step-content">
      <div className="step-description">
        <p>Create envelopes for different spending categories. We've added some common ones to get you started.</p>
      </div>

      <div className="envelope-list-onboarding">
        {envelopes.map((env, index) => (
          <div key={index} className="envelope-item-onboarding">
            <span className="envelope-icon">
              {env.category === 'need' ? '🛒' : env.category === 'want' ? '🎉' : '💰'}
            </span>
            <span className="envelope-name">{env.name}</span>
            <span className="envelope-category">{env.category}</span>
            <button className="btn-remove" onClick={() => handleRemove(index)}>×</button>
          </div>
        ))}
      </div>

      <div className="add-envelope-form">
        <input
          type="text"
          className="envelope-input"
          placeholder="Add envelope (e.g., Transport, Dining Out)..."
          value={newEnvelope}
          onChange={(e) => setNewEnvelope(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <select
          className="category-select"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        >
          <option value="need">Need</option>
          <option value="want">Want</option>
          <option value="saving">Saving</option>
        </select>
        <button className="btn-add" onClick={handleAdd}>Add</button>
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button 
          className="btn-primary" 
          onClick={() => onNext({ envelopes })}
          disabled={envelopes.length === 0}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

const PaymentMethodsStep = ({ userData, onNext, onBack }) => {
  const [methods, setMethods] = useState(userData.paymentMethods || ['Cash', 'Bank Account']);
  const [newMethod, setNewMethod] = useState('');

  const handleAdd = () => {
    if (newMethod.trim() && !methods.includes(newMethod.trim())) {
      setMethods([...methods, newMethod.trim()]);
      setNewMethod('');
    }
  };

  const handleRemove = (index) => {
    setMethods(methods.filter((_, i) => i !== index));
  };

  return (
    <div className="step-content">
      <div className="step-description">
        <p>Add your bank accounts, credit cards, cash, and digital wallets.</p>
      </div>

      <div className="method-list-onboarding">
        {methods.map((method, index) => (
          <div key={index} className="method-item-onboarding">
            <span className="method-icon">💳</span>
            <span className="method-name">{method}</span>
            <button className="btn-remove" onClick={() => handleRemove(index)}>×</button>
          </div>
        ))}
      </div>

      <div className="add-method-form">
        <input
          type="text"
          className="method-input"
          placeholder="Add payment method (e.g., HDFC Bank, Credit Card)..."
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn-add" onClick={handleAdd}>Add</button>
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button 
          className="btn-primary" 
          onClick={() => onNext({ paymentMethods: methods })}
          disabled={methods.length === 0}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

const IncomeStep = ({ userData, onNext, onBack }) => {
  return (
    <div className="step-content">
      <div className="step-description">
        <p>You can add your first income transaction after setup. For now, let's complete the onboarding!</p>
      </div>

      <div className="income-illustration">
        <div className="illustration-icon">💵</div>
        <p className="illustration-text">You'll be able to log income and expenses from the main screen</p>
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button className="btn-primary" onClick={() => onNext({})}>
          Continue →
        </button>
      </div>
    </div>
  );
};

const CompleteStep = ({ onNext }) => {
  return (
    <div className="step-content">
      <div className="complete-illustration">
        <div className="illustration-icon celebration">🎉</div>
      </div>

      <div className="complete-text">
        <h3>You're Ready to Budget!</h3>
        <p>Here's what to do next:</p>
        <ol className="next-steps-list">
          <li>Add your income transactions</li>
          <li>Fill your envelopes with money</li>
          <li>Start tracking expenses</li>
          <li>Watch your financial goals come to life!</li>
        </ol>
      </div>

      <div className="step-actions">
        <button className="btn-primary btn-large" onClick={() => onNext({})}>
          Start Budgeting! 🚀
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
