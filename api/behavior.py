import numpy as np

def charging_behavior_parameter(cases):
    # beta_SOC,beta_R,beta_delta_SOC,beta_0,beta_cost,beta_SOC_0,lbd
    parameter_list = [[3,0,2,1,0.1,0.3,1],
                     [8,0,2,1,0.1,0.3,1],
                     [2,0,2,1,0.1,0.3,1],
                     [3,0.005,2,1,0.1,0.3,1],
                     [3,-0.005,2,1,0.1,0.3,1],
                     [3,0,2,1,0.2,0.3,1],
                     [3,0,2,1,0.1,0.2,1]]
    if cases == 'base':
        res = parameter_list[0]
    if cases == 'low_risk_sensitive':
        res = parameter_list[1]
    if cases == 'high_risk_sensitive':
        res = parameter_list[2]
    if cases == 'prefer_fast_charge':
        res = parameter_list[3]
    if cases == 'dislike_fast_charge':
        res = parameter_list[4]
    if cases == 'high_cost_sensitive':
        res = parameter_list[5]
    if cases == 'low_range_buffer':
        res = parameter_list[6]
    return res

def V_SOC(SOC_a, beta_SOC, beta_SOC_0):
    if SOC_a == 1:
        V_SOC = - beta_SOC*10 #replace np.inf because of calculation issue
    elif SOC_a == 0:
        V_SOC =   beta_SOC*10 #np.inf
    else:
        def safe_log(x, default_value=-np.inf):
            if x <= 0:
                return default_value
            return np.log(x)
        V_SOC = beta_SOC*safe_log((1-SOC_a)/((1/beta_SOC_0-1)*SOC_a))
    return V_SOC

def V_rate(rrate, beta_R, rate):
    V_rate = beta_R*(rrate-rate[0])
    return V_rate

def V_d_SOC(SOC_b, beta_delta_SOC):
    V_d_SOC = beta_delta_SOC*(1-(SOC_b-1)**2)
    return V_d_SOC

def cost_home(home_price,delta_SOC_i,Enn):
    cost_home = home_price*delta_SOC_i*Enn 
    return cost_home

def V_cost(cost_a,cost_home, beta_cost):
    V_cost = -beta_cost*(cost_a-cost_home) 
    return V_cost

def charging_choice(SOC_l,d_time,Enn,L_available,pubprice, rate, home_price, behavior_params):
    ## indirect utility of all 4 charging mode [0,L1,L2,L3]

    beta_SOC,beta_R,beta_delta_SOC,beta_0,beta_cost,beta_SOC_0,lbd = behavior_params
    
    # charge SOC of L1, L2, L3
    SOC_1 = [1-SOC_l]*3
    SOC_2 = rate*(d_time/Enn)
    SOC_3=tuple(zip(SOC_1,SOC_2))
    delta_SOC = np.array([min(i) for i in SOC_3])
    price = np.array([home_price,pubprice,pubprice])
    
    # cost of L1, L2, L3
    cost_l = np.multiply(delta_SOC*Enn,price)

    # indirect utility of all charging mode [0,L1,L2,L3]
    V = [0]*4
    V_r = [0]*3
    V_d_s = [0]*3
    V_c_home = [0]*3
    V_c = [0]*3
    for i in range(3):
    
        V_r[i] = V_rate(rate[i], beta_R, rate)
        V_d_s[i] = V_d_SOC(delta_SOC[i], beta_delta_SOC)
        V_c_home[i] = cost_home(home_price,delta_SOC[i],Enn)
        V_c[i] = V_cost(cost_l[i],V_c_home[i], beta_cost)

        V[i+1] = beta_0 + V_SOC(SOC_l, beta_SOC, beta_SOC_0) + V_r[i] + V_d_s[i] + V_c[i]        
    
    #print('V_c:',V_c)
    #print('V_d_s:',V_d_s)    
    #print('V_r:',V_r)
    #print('V:',V)   
    
    # e^V
    e_V = np.exp([lbd**(-1) * i for i in V]) 
    for i in range(len(L_available)):
        if L_available[i] == 0:
            e_V[i+1] = 0
        
    #print('e_V',e_V)
    sum_e_V = sum(e_V)

    if sum_e_V==0:
        sum_e_V=1

    p_l = e_V/sum_e_V
    #print('p',p_l)
    #print('probability per L',p_l)

    #p_l = np.nan_to_num(p_l)

    draw = np.random.choice(range(4), 1, p=p_l)

    return draw, p_l #, V, SOC_2,  V_d_s, V_c, delta_SOC