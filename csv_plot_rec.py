import os
from keys import openai_key
from langchain_openai import ChatOpenAI
from langchain.output_parsers import CommaSeparatedListOutputParser
from langchain_core.prompts import PromptTemplate

class MovieRecommender:
    def __init__(self, openai_key: str, model_name = "gpt-4", temperature =0.6):
        os.environ["OPENAI_API_KEY"] = openai_key
        self.model = ChatOpenAI(model=model_name, temperature=temperature)
        
        self.parser = CommaSeparatedListOutputParser()

        format_instructions = self.parser.get_format_instructions()

        self.guest_guess_template = PromptTemplate(
            template="Guess the movie :{subject}\n{format_instructions}",
            input_variables=["subject"],
            partial_variables={"format_instructions": format_instructions},
        )

        self.guest_guess_chain = self.guest_guess_template | self.model | self.parser

        self.guest_rec_template = PromptTemplate(
            template="Recommend top 5 similar movies like :{subject}\n{format_instructions}",
            input_variables=["subject"],
            partial_variables={"format_instructions": format_instructions},
        )

        self.guest_rec_chain = self.guest_rec_template | self.model | self.parser

    def guess_movie(self, plot: str):
        
        response = self.guest_guess_chain.invoke({"subject": plot})
        return response

    def rec_movie(self, plot:str):

        response = self.guest_rec_chain.invoke({"subject": plot})
        return response

if __name__ == "__main__":
    key = openai_key  
    recommender = MovieRecommender(key)
    plot = "Dom and the crew must take on an international terrorist who turns out to be Dom and Mia's estranged brother."
    guess = recommender.guess_movie(plot)
    rec = recommender.rec_movie(plot)
    print (rec)
    print(guess)
    print(type(guess))