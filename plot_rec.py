import os
from keys import openai_key
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

class MovieRecommender:
    def __init__(self, openai_key: str, model_name="gpt-4", temperature=0.6):
        
        os.environ["OPENAI_API_KEY"] = openai_key
        
        self.model = ChatOpenAI(model=model_name, temperature=temperature)
        
        self.system_template = (
            "Guess the movie from the plot mentioned: {input}? "
            "Give the title of the top 5 movie recommendations based on the plot."
            "Display the results in the mentioned format Title: , Release Date: , Genre: ;"
        )
        
        self.parser = StrOutputParser()

        self.prompt_template = ChatPromptTemplate.from_messages(
            [("system", self.system_template), ("human", "{input}")]
        )
        
        self.chain = self.prompt_template | self.model | self.parser

    def recommend_movies(self, plot: str):
        
        response = self.chain.invoke({"input": plot})
        return response

if __name__ == "__main__":
    key = openai_key  
    recommender = MovieRecommender(key)
    plot = "Dom and the crew must take on an international terrorist who turns out to be Dom and Mia's estranged brother."
    recommendations = recommender.recommend_movies(plot)
    print(recommendations)
    print(type(recommendations))