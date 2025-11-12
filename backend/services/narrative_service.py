from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class NarrativeService:
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    
    async def generate_narrative(self, today: float, mtd: float, ytd: float,
                                rhi: float, top_products: List[Dict],
                                anomalies: List[Dict]) -> str:
        """
        Generate AI-powered narrative insights using LLM.
        """
        if not self.api_key:
            return self._generate_fallback_narrative(today, mtd, ytd, rhi, top_products, anomalies)
        
        try:
            # Create LLM chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"narrative_{int(today)}",
                system_message="You are a financial analyst specializing in revenue analytics. Provide concise, actionable insights in 2-3 sentences."
            ).with_model("openai", "gpt-4o-mini")
            
            # Prepare context
            top_product_names = [p['name'] for p in top_products[:3]]
            anomaly_count = len(anomalies)
            spike_count = sum(1 for a in anomalies if a['direction'] == 'spike')
            drop_count = anomaly_count - spike_count
            
            prompt = f"""
Analyze this revenue data and provide a brief narrative summary:

- Today's revenue: ${today:,.2f}
- Month-to-date: ${mtd:,.2f}
- Year-to-date: ${ytd:,.2f}
- Revenue Health Index: {rhi}%
- Top products: {', '.join(top_product_names)}
- Anomalies detected: {anomaly_count} ({spike_count} spikes, {drop_count} drops)

Provide 2-3 sentences highlighting key insights and trends.
"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Failed to generate AI narrative: {str(e)}")
            return self._generate_fallback_narrative(today, mtd, ytd, rhi, top_products, anomalies)
    
    def _generate_fallback_narrative(self, today: float, mtd: float, ytd: float,
                                    rhi: float, top_products: List[Dict],
                                    anomalies: List[Dict]) -> str:
        """
        Generate a rule-based narrative when LLM is not available.
        """
        parts = []
        
        # Revenue trend
        if mtd > 0:
            parts.append(f"Month-to-date revenue stands at ${mtd:,.2f}.")
        
        # Today's performance
        if today > 0:
            parts.append(f"Today generated ${today:,.2f} in revenue.")
        
        # Top products
        if top_products:
            top_product = top_products[0]
            parts.append(f"Leading product is {top_product['name']} with ${top_product['revenue']:,.2f} in sales.")
        
        # Anomalies
        if anomalies:
            spike_count = sum(1 for a in anomalies if a['direction'] == 'spike')
            drop_count = len(anomalies) - spike_count
            if spike_count > 0 and drop_count > 0:
                parts.append(f"{len(anomalies)} anomalies detected ({spike_count} spikes, {drop_count} drops) requiring attention.")
            elif spike_count > 0:
                parts.append(f"{spike_count} revenue spikes detected indicating strong performance periods.")
            elif drop_count > 0:
                parts.append(f"{drop_count} revenue drops detected that may need investigation.")
        
        # Health index
        if rhi >= 70:
            parts.append(f"Revenue Health Index at {rhi}% indicates strong overall performance.")
        elif rhi >= 50:
            parts.append(f"Revenue Health Index at {rhi}% shows moderate performance with room for improvement.")
        else:
            parts.append(f"Revenue Health Index at {rhi}% suggests attention needed to improve key metrics.")
        
        return " ".join(parts) if parts else "Insufficient data for narrative generation."
