import * as supa from "./api.supabase";
import * as mock from "./api.mock";

export const isDemo = !import.meta.env.VITE_SUPABASE_URL;
const impl = isDemo ? mock : supa;

export const listMenu = impl.listMenu;
export const createOrder = impl.createOrder;
export const getOrder = impl.getOrder;
export const submitSurvey = impl.submitSurvey;
export const getAdminSession = impl.getAdminSession;
export const adminSignIn = impl.adminSignIn;
export const adminSignOut = impl.adminSignOut;
export const listBoardOrders = impl.listBoardOrders;
export const listOrdersRange = impl.listOrdersRange;
export const listSurveysRange = impl.listSurveysRange;
export const setOrderStatus = impl.setOrderStatus;
export const subscribeOrders = impl.subscribeOrders;
export const saveMenuItem = impl.saveMenuItem;
export const deleteMenuItem = impl.deleteMenuItem;
