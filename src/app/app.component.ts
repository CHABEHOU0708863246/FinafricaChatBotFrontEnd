import { HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InsurancePack } from './core/models/InsurancePack';
import { VehicleInfo } from './core/models/VehicleInfo';
import { FleetQuoteService } from './core/services/fleet-quote.service';
import { format, Locale } from 'date-fns';
import { VehicleInfoRequest } from './core/models/VehicleInfoRequest';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [
    FleetQuoteService
  ],
})
export class AppComponent implements OnInit {

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chatbotContainer') chatbotContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('toggleChatbotButton') toggleChatbotButton!: ElementRef<HTMLButtonElement>;

  isChatbotCollapsed: boolean = false;
  vehicleInfo: VehicleInfo = {
    category: '',
    usage: '',
    genre: '',
    fiscalPower: 0,
    energyType: '',
    seatNumber: 0,
    newValue: 0,
    marketValue: 0,
    hasTrailer: false,
    firstRegistrationDate: new Date(),
    contractDuration: 0
  };

  toggleChatbot() {
    this.isChatbotCollapsed = !this.isChatbotCollapsed;
    const chatbotContainer = this.chatbotContainer.nativeElement;
    const toggleChatbotButton = this.toggleChatbotButton.nativeElement;

    if (this.isChatbotCollapsed) {
      chatbotContainer.classList.add('collapsed');
      toggleChatbotButton.textContent = 'Agrandir';
    } else {
      chatbotContainer.classList.remove('collapsed');
      toggleChatbotButton.textContent = 'Réduire';
    }
  }


  selectedDuration: number | null = null;
  insurancePacks: InsurancePack[] = [];
  selectedPack: InsurancePack | null = null;
  additionalOptions: string[] = [];
  totalPremium: number = 0;
  userInfo: { name: string, address: string, phone: string, email: string } = {
    name: '',
    address: '',
    phone: '',
    email: ''
  };
  chatMessages: { sender: 'bot' | 'user', message: string }[] = [];

  currentStep: number = 0;
  currentQuestionIndex: number = 0;
  vehicleQuestions: string[] = [
    'Catégorie du véhicule (Catégorie 1 à Catégorie 5) :',
    'Usage du véhicule (privé, professionnel, auto-école, location, etc.) :',
    'Genre du véhicule (tourisme, utilitaire a corrosserie, etc.) :',
    'Puissance fiscale du véhicule (en CV) :',
    'Type d\'énergie du véhicule (essence ou diesel) :',
    'Nombre de places dans le véhicule :',
    'Valeur à neuf du véhicule (en FCFA) :',
    'Valeur de marché du véhicule (en FCFA) :',
    'Indiquez si le véhicule possède une remorque (true pour oui, false pour non) :',
    "Date de première immatriculation du véhicule (JJ/MM/AAAA) :",
    "Durée du contrat d'assurance souhaitée (en mois) :"
  ];

  initialOptions: string[] = [
    '1. Obtenir une simulation de tarification pour un véhicule particulier',
    '2. Obtenir une simulation de tarification pour une flotte de véhicules',
    '3. Comparer les offres d\'assurance',
    '4. Gérer mon contrat d\'assurance',
    '5. Parler à un conseiller'
  ];

  constructor(private fleetQuoteService: FleetQuoteService) { }

  ngOnInit() {
    this.sendBotMessage('Bonjour ! Je suis Leila, votre assistant pour la tarification d\'assurance automobile. Comment puis-je vous aider aujourd\'hui ?');
  }



  sendUserMessage(message: string) {
    const cleanedMessage = message.replace(/\n/g, '');
    this.chatMessages.push({ sender: 'user', message: cleanedMessage });
    this.processUserMessage(cleanedMessage);
  }


  sendBotMessage(message: string) {
    this.chatMessages.push({ sender: 'bot', message });
  }

  async processUserMessage(message: string) {
    if (this.currentStep === 1) {
      this.collectVehicleInfoStep(message);
    } else {
      switch (message) {
        case '1. Obtenir une simulation de tarification pour un véhicule particulier':
          this.currentStep = 1;
          this.sendBotMessage('Parfait ! Commençons la simulation. Veuillez fournir les informations suivantes :');
          this.sendBotMessage(this.vehicleQuestions[this.currentQuestionIndex]);
          break;
        case '2. Obtenir une simulation de tarification pour une flotte de véhicules':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '3. Comparer les offres d\'assurance':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '4. Gérer mon contrat d\'assurance':
          this.sendBotMessage('Fonctionnalité en cours de développement.');
          break;
        case '5. Parler à un conseiller':
          this.contactAdvisor();
          break;
        default:
          this.sendBotMessage('Je ne comprends pas votre demande. Veuillez sélectionner une option parmi les suivantes :');
          this.initialOptions.forEach(option => this.sendBotMessage(option));
          break;
      }
    }
  }

  askNextVehicleQuestion() {
    if (this.currentQuestionIndex < this.vehicleQuestions.length) {
      this.sendBotMessage(`Veuillez fournir les informations suivantes pour votre véhicule : ${this.vehicleQuestions[this.currentQuestionIndex]}`);
    } else {
      this.currentStep = 0;
      this.simulateTarification();
    }
  }

  cleanInput(input: string): string {
    return input.replace(/\n/g, '');
  }

  async collectVehicleInfoStep(message: string) {
    switch (this.currentQuestionIndex) {
      case 0:
        this.vehicleInfo.category = this.cleanInput(message);
        break;
      case 1:
        this.vehicleInfo.usage = this.cleanInput(message);
        break;
      case 2:
        this.vehicleInfo.genre = this.cleanInput(message);
        break;
      case 3:
        this.vehicleInfo.fiscalPower = parseInt(message, 10);
        break;
      case 4:
        this.vehicleInfo.energyType = message;
        break;
      case 5:
        this.vehicleInfo.seatNumber = parseInt(message, 10);
        break;
      case 6:
        this.vehicleInfo.newValue = parseFloat(message);
        break;
      case 7:
        this.vehicleInfo.marketValue = parseFloat(message);
        break;
      case 8:
        this.vehicleInfo.hasTrailer = message.toLowerCase() === 'true';
        break;
      case 9:
        const dateParts = message.split('/');
        this.vehicleInfo.firstRegistrationDate = new Date(parseInt(dateParts[2], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[0], 10)).toISOString();
        break;
      case 10:
        this.vehicleInfo.contractDuration = parseInt(message, 10);
        await this.calculatePremium();
        return;
    }
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.vehicleQuestions.length) {
      this.sendBotMessage(this.vehicleQuestions[this.currentQuestionIndex]);
    }
  }

  async calculatePremium() {
    try {
      const premium = await this.fleetQuoteService.calculateInsurancePremium(this.vehicleInfo).toPromise();
      if (premium !== undefined) {
        this.totalPremium = premium;
        this.sendBotMessage(`Le montant total de votre prime d'assurance est de ${premium} FCFA.`);
        this.displayInsurancePacks();
      } else {
        this.sendBotMessage('Erreur lors du calcul de la prime d\'assurance. Prime non définie.');
      }
    } catch (error) {
      console.error('Erreur lors du calcul de la prime d\'assurance :', error);
      this.sendBotMessage('Erreur lors du calcul de la prime d\'assurance. Veuillez vérifier les informations fournies et réessayer.');
    }
  }



  collectFleetInfo() {
    this.currentStep = 1;
    this.sendBotMessage('Veuillez fournir les informations suivantes pour votre flotte de véhicules :\n' +
      'Nombre de véhicules, Usage de chaque véhicule, Genre de chaque véhicule, Puissance fiscale de chaque véhicule, ' +
      'Type d\'énergie de chaque véhicule, Nombre de places de chaque véhicule, Valeur à neuf de chaque véhicule, ' +
      'Valeur de marché de chaque véhicule, Date de première immatriculation de chaque véhicule, Capacité de chargement, ' +
      'Durée du contrat en mois');
  }

  compareInsuranceOffers() {
    this.currentStep = 2;
    this.sendBotMessage('Veuillez fournir les détails de votre couverture actuelle et les critères de comparaison :\n' +
      'Nom de l\'assureur actuel, Type de couverture, Montant de la prime, Durée de la couverture, Options supplémentaires souhaitées');
  }

  manageInsuranceContract() {
    this.currentStep = 2;
    this.sendBotMessage('Veuillez fournir les informations suivantes pour gérer votre contrat d\'assurance :\n' +
      'Numéro de contrat, Nom de l\'assureur, Type de contrat, Date de début et de fin du contrat, Options à modifier');
  }

  contactAdvisor() {
    this.currentStep = 2;
    const advisorInfo = {
      name: 'Mme Leila de finafrica',
      email: 'support@finafrica.com'
    };

    this.sendBotMessage(`Une conseillère, ${advisorInfo.name}, sera avec vous sous peu.`);
    this.sendBotMessage(`Vous pouvez le contacter à l'adresse e-mail : ${advisorInfo.email}.`);

  }

  simulateTarification() {
    const vehicleInfoForRequest: VehicleInfo = {
      ...this.vehicleInfo,
      firstRegistrationDate: this.vehicleInfo.firstRegistrationDate.toString()
    };

    this.fleetQuoteService.calculateInsurancePremium(vehicleInfoForRequest)
      .subscribe(
        (premium) => {
          this.totalPremium = premium;
          this.sendBotMessage(`Le coût total de votre prime d'assurance est de ${premium} FCFA. Voulez-vous procéder au paiement ?`);
        },
        (error) => {
          console.error('Erreur lors de la simulation de tarification:', error);
          this.sendBotMessage('Une erreur est survenue lors de la simulation de tarification. Veuillez réessayer plus tard.');
        }
      );
}





  displayInsurancePacks() {
    let packMessage = 'Voici les packs disponibles :\n';
    for (const pack of this.insurancePacks) {
      packMessage += `${pack.name} : Tarif 3 mois ${pack.price3Months} FCFA, Tarif 6 mois ${pack.price6Months} FCFA, Tarif 12 mois ${pack.price12Months} FCFA, Garanties incluses : ${pack.includedCoverages.join(', ')}\n`;
    }
    packMessage += 'Souhaitez-vous comparer les packs disponibles ou sélectionner directement un pack ?';
    this.sendBotMessage(packMessage);
  }

  compareInsurancePacks() {
    if (this.insurancePacks.length > 0) {
      let comparisonMessage = 'Comparaison des packs d\'assurance :\n';
      for (const pack of this.insurancePacks) {
        comparisonMessage += `Pack: ${pack.name}\n` +
          `- Tarif 3 mois: ${pack.price3Months} FCFA\n` +
          `- Tarif 6 mois: ${pack.price6Months} FCFA\n` +
          `- Tarif 12 mois: ${pack.price12Months} FCFA\n` +
          `- Garanties incluses: ${pack.includedCoverages.join(', ')}\n\n`;
      }
      this.sendBotMessage(comparisonMessage);
    } else {
      this.sendBotMessage('Aucun pack d\'assurance disponible pour la comparaison.');
    }
  }

  selectInsurancePack(packName: string) {
    const selectedPack = this.insurancePacks.find((pack) => pack.name === packName);
    if (selectedPack) {
      this.selectedPack = selectedPack;
      this.sendBotMessage(`Vous avez sélectionné le pack ${selectedPack.name}.`);
      this.addAdditionalOptions();
    } else {
      this.sendBotMessage('Pack d\'assurance non valide. Veuillez sélectionner un pack parmi ceux proposés.');
    }
  }

  addAdditionalOptions() {
    this.sendBotMessage('Souhaitez-vous ajouter des options supplémentaires à votre pack ? Voici les options disponibles :');
    // Logique pour afficher les options supplémentaires disponibles
    this.calculateTotalPremium();
  }

  calculateTotalPremium() {
    if (this.selectedPack) {
      if (this.selectedDuration === null) {
        this.sendBotMessage('Veuillez choisir la durée de votre pack d\'assurance (3 mois, 6 mois ou 12 mois).');
      } else {
        let totalPremium;
        switch (this.selectedDuration) {
          case 3:
            totalPremium = this.selectedPack.price3Months;
            break;
          case 6:
            totalPremium = this.selectedPack.price6Months;
            break;
          case 12:
            totalPremium = this.selectedPack.price12Months;
            break;
          default:
            this.sendBotMessage('Durée invalide. Veuillez choisir 3, 6 ou 12 mois.');
            return;
        }

        this.totalPremium = totalPremium;
        this.sendBotMessage(`Calcul de votre prime en cours...`);
        this.collectUserInfo();
      }
    } else {
      this.sendBotMessage('Veuillez d\'abord sélectionner un pack d\'assurance.');
    }
  }

  selectDuration(duration: number) {
    this.selectedDuration = duration;
    this.calculateTotalPremium();
  }

  collectUserInfo() {
    this.sendBotMessage('Veuillez fournir vos informations personnelles pour finaliser le devis.');
    // Logique pour collecter les informations de l'utilisateur
    this.displayQuoteSummary();
  }

  displayQuoteSummary() {
    let quoteSummary = 'Voici le résumé de vos informations :\n';
    quoteSummary += `Nom : ${this.userInfo.name}\n`;
    quoteSummary += `Adresse : ${this.userInfo.address}\n`;
    quoteSummary += `Téléphone : ${this.userInfo.phone}\n`;
    quoteSummary += `Email : ${this.userInfo.email}\n`;
    quoteSummary += `Prime annuelle : ${this.totalPremium} FCFA\n`;
    quoteSummary += 'Compagnie d\'assurance : Finafrica\n';
    quoteSummary += 'Produit d\'assurance : Assurance automobile tous risques\n';
    quoteSummary += 'Voulez-vous procéder au paiement pour finaliser votre souscription ?';
    this.sendBotMessage(quoteSummary);
  }

  processPayment() {
    this.sendBotMessage('Merci de confirmer votre choix pour procéder au paiement sécurisé.');
    this.fleetQuoteService.processPayment(this.totalPremium).subscribe(
      (paymentStatus) => {
        this.sendBotMessage(paymentStatus);
        // Logique supplémentaire après le paiement réussi
      }
    );
  }


  sendMessage() {
    const messageText = this.messageInput.nativeElement.value.trim();
    if (messageText) {
      this.sendUserMessage(messageText);
      this.messageInput.nativeElement.value = '';
    }
  }


}
