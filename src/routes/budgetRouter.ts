import { Router } from "express";
import { BudgetController } from "../controllers/BudgetController";
import { ExpensesController } from "../controllers/ExpenseController";
import { handleInputErrors } from "../middleware/validation";
import { hasAccess, validateBudgetExist, validateBudgetInput, validationBudgetId } from "../middleware/budget";
import { belongsToBudget, validateExpenseExist, validateExpenseId, validateExpenseInput } from "../middleware/expense";
import { autentcate } from "../middleware/auth";

const router = Router()

router.use(autentcate)

router.param('budgetId', validationBudgetId)
router.param('budgetId', validateBudgetExist)
router.param('budgetId', hasAccess)

router.param('expenseId', validateExpenseId)
router.param('expenseId', validateExpenseExist)
router.param('expenseId', belongsToBudget)

router.get('/', BudgetController.getAll)

router.post('/',
   validateBudgetInput,
   handleInputErrors,
   BudgetController.create
)

router.get('/:budgetId',
   handleInputErrors,
   BudgetController.getById
)

router.put('/:budgetId',
   validateBudgetInput,
   handleInputErrors,
   BudgetController.update
)

router.delete('/:budgetId',
   handleInputErrors,
   BudgetController.delete
)

/** Routes for Expenses */
router.post('/:budgetId/expenses',
   validateExpenseInput,
   handleInputErrors,
   ExpensesController.create
)

router.get('/:budgetId/expenses/:expenseId',
   handleInputErrors,
   ExpensesController.getById
)

router.put('/:budgetId/expenses/:expenseId',
   validateExpenseInput,
   handleInputErrors,
   ExpensesController.update
)

router.delete('/:budgetId/expenses/:expenseId',
   handleInputErrors,
   ExpensesController.delete
)

export default router